# Backend datetime

> Also read the [backend testing](./backend-testing.md) doc before you write datetime tests.

Rules for code that handles dates, times and durations. They apply when you write code and when you review it.

The service runs in `Europe/Helsinki`. Most bugs come from the daylight saving time (DST) changes,
and from the 2 or 3 hour difference between UTC and local time:

- In spring, local time jumps from 03:00 to 04:00. The day has 23 hours, and 03:00 to 03:59 does not exist.
- In autumn, local time goes back from 04:00 to 03:00. The day has 25 hours, and 03:00 to 03:59 occurs twice.
- The next local date starts at 21:00 UTC in summer and at 22:00 UTC in winter.

## Helpers

`backend/utils/date_utils.py` has the correct way to do each of these. Use the helper, not a hand-written version.
These helpers raise `NaiveDatetimeError` for a naive datetime: `local_date_of()`, `local_add_days()`, `add_elapsed_time()`,
and `local_start_of_day()`, `local_next_start_of_day()` and `local_end_of_day()` when they get a datetime.

| Need                                                  | Helper                                                                    |
|-------------------------------------------------------|---------------------------------------------------------------------------|
| The current time, date or wall clock time             | `local_datetime()`, `local_date()`, `local_time()`, `utc_datetime()`      |
| A local datetime from parts                           | `local_datetime(year, month, day, hour, minute)`                          |
| The local date of a datetime                          | `local_date_of(value)`                                                    |
| A local datetime from a date and a `TimeField` value  | `local_combine(date, time)`                                               |
| The same wall clock time some days later              | `local_add_days(value, days=...)`                                         |
| A moment some real time later                         | `add_elapsed_time(value, delta=...)`                                      |
| The real time between two datetimes                   | `datetime_difference(start_datetime=..., end_datetime=...)`               |
| The start of a day, and its end in a half-open range  | `local_start_of_day(value)`, `local_next_start_of_day(value)`             |
| A check for the spring gap                            | `local_datetime_exists(value)`                                            |
| The length between two `TimeField` values             | `time_difference(begin, end)`, `end_time_as_timedelta(end)`               |
| An ISO string from an API                             | `from_iso_format(string, timezone=...)`, `local_from_iso_format(string)`  |
| A string in another format, with no offset            | `parse_naive_datetime(string, string_format=..., timezone=...)`           |
| Text for users                                        | `local_datetime_string()`, `datetime_range_as_string()`                   |

- `datetime.now()`, `date.today()` and `datetime.astimezone()` with no argument use the system time zone.
  Django sets the system time zone to `TIME_ZONE` when the settings load. Code that runs before that gets another zone.
- A naive datetime given to `.astimezone(tz)` or `.timestamp()` is read as system local time.
  This also applies to the result of `strptime()` and `fromtimestamp()` without `tz`.
  In Django this is `Europe/Helsinki`. A naive UTC value is then wrong by 2 or 3 hours, with no error.
  For a timestamp, use `fromtimestamp(value, tz=datetime.UTC)`.
- `utcnow()` and `utcfromtimestamp()` return naive values.
- Comparing a naive datetime with an aware datetime raises `TypeError`.
- Use `DEFAULT_TIMEZONE` or `datetime.UTC` as the time zone.
  `datetime.timezone(timedelta(hours=2))` is a fixed offset. It does not change at DST.
- Write a zone ID with its exact spelling, such as `Europe/Helsinki`.
  `ZoneInfo` finds the zone as a file, so another case can work on macOS and fail on Linux.

## Local date

- Get the date of a datetime with `local_date_of(value)`.
  `value.date()` on a UTC datetime gives the previous date for 00:00 to 02:59 local time.
- Pricings, opening hours, application periods, weekdays and "today" are all local dates.
  Use the local date also for weekdays in emails and access codes.
- A `datetime` is a subclass of `date`. `isinstance(value, datetime.date)` is true for a datetime too.
  Check for `datetime.datetime` first.
- Comparing a `datetime` with a `date` raises `TypeError`, even though the type allows it.
  Convert the datetime with `local_date_of()` first.

## Elapsed time and calendar time

Python adds, subtracts and compares two datetimes with the same `tzinfo` on the wall clock.
It does not use the real time between them.

- For elapsed time, use `add_elapsed_time()` and `datetime_difference()`.
  This applies to durations, buffers, expiry times, deadlines, payment and cancellation times, and price per hour.
- For calendar steps, use `local_add_days()`. Examples are "the next day at the same time" and "the next week".
  A local day is 23, 24 or 25 hours. Do not count it as 1440 minutes.
- Decide which one the rule means. A price per day counts local days. A price per hour counts real hours.
  A buffer of "the whole day" ends at the next local midnight, not after 24 hours.
- Python uses real time only when the two `tzinfo` objects are different objects.
  A datetime from the database is in UTC, and a datetime from `local_datetime()` is in `Europe/Helsinki`.
  Code cannot see which case it is in, so convert both values to UTC before you subtract.
- `timedelta.seconds` is the remainder after whole days, not the total. It is wrong for negative values
  and for durations of a day or more. Use `total_seconds()`.

## Missing and repeated hours

- A local time made from a date and a time can be in the spring gap. Check it with `local_datetime_exists()`
  when the time comes from the user or from data, such as reservable times and opening hours.
- A plain `+` on a local datetime can give a time in the gap. `local_add_days()` and `add_elapsed_time()` do not.
- A time in the autumn hour is ambiguous. Python uses `fold=0` (the first one) by default, and gives no warning.
  Set `fold` when the code means the second one.
- A `+` or `-` with a `timedelta` sets `fold=0` on the result, also for `timedelta(0)`.
  A value in the second autumn hour then moves to the first one, one hour earlier.
  Do the math in UTC, or skip it when there is nothing to add.
- Comparisons in the autumn hour are wrong:
  - On two values in the same zone, `==` and `<` ignore `fold`. Two different moments compare equal.
  - On two values in different zones, `==` is `False`, even when they are the same moment.
  - Convert both values to UTC before you compare them.

## Day boundaries

- Use half-open ranges: `begin <= value < end`. The end of a day is `local_next_start_of_day()`.
  `local_end_of_day()` returns 23:59:59.999999. A filter with `<=` on it is correct, but a range that ends there has a gap.
- A `TimeField` end time of `00:00` means the end of the day. Use `end_time_as_timedelta()` and `time_difference()`.
  A plain `end_time > begin_time` check rejects a range that ends at midnight.
- A range that ends after midnight on the next day needs a decision. Check what the model and its constraints allow.

## Database

- `DateTimeField` values are stored in UTC.
- `__date`, `__week_day`, `__hour` and `Trunc*` use the current time zone of Django, which is `Europe/Helsinki`.
  A value from them is local, and a Python value compared to them must be local too.
- A `TimeField` has no time zone. It is a local wall time. Combine it with a local date with `local_combine()`.
- A new check constraint on times also checks the existing rows. Find the rows that break it before the migration.
  The `Migrations` rules in [backend ORM](./backend-orm.md) apply.

## Integrations and output

- Read the time zone of each external API from its docs. Do not assume UTC or local time.
  Parse with `from_iso_format()` or `parse_naive_datetime()` and the zone of the API.
  `from_iso_format()` keeps the moment when the input has an offset, and converts it to the zone you give.
- Show users local time. Convert with `local_datetime_string()` or `local_iso_format()`.
- A range that ends at the next midnight is shown as `24:00`, not `00:00`.

## Background tasks

- Celery uses `Europe/Helsinki`. The schedules are in `django-celery-beat` in the database.
  A task scheduled between 03:00 and 03:59 local time can be skipped in spring and run twice in autumn.
  Schedule tasks outside that hour, or make them safe to run twice.
- A task that finds "yesterday" or "today" must use the local date.

## Tests

Most tests freeze time in January. These tests do not find DST bugs or bugs near midnight.

- Freeze time with an explicit offset, or with `local_datetime(...)`. `freeze_time("2024-01-01")` without an offset is UTC.
- Add tests for code that does time math. Cover these cases:
  - A range that crosses the spring change, the last Sunday of March.
  - A range that crosses the autumn change, the last Sunday of October.
  - A local time between 00:00 and 02:59. Its UTC date is the previous day.
  - A range that ends at 00:00 the next day.
  - For calendar units, a period that contains a DST change.
- Check durations in real time. A reservation from 00:00 to 00:00 on the autumn change day is 25 hours.
- `tests/plugins.py` patches freezegun to keep `fold`. `FakeDatetime.now(tz)` can still lose `fold` in the repeated hour.
  Freeze time in UTC when a test needs the second occurrence of that hour.
- Write the expected value as a literal, not with the same helper that the code uses.
  A shared helper gives the same wrong answer in the code and in the test.
