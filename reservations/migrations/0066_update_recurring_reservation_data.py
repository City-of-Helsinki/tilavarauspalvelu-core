import logging

from django.db import migrations

logger = logging.getLogger(__name__)


def update_recurring_reservations(apps, schema_editor):
    RecurringReservation = apps.get_model("reservations", "RecurringReservation")
    for recurring in RecurringReservation.objects.all():
        # `weekdays_new` is an intermediate field created just for migrations
        recurring.weekdays_new = [int(w) for w in recurring.weekdays.split(",") if w != "" and w in "0123456"]

        if recurring.recurrence_in_days is not None and recurring.recurrence_in_days % 7 != 0:
            msg = (
                f"Recurring reservation {recurring.pk} had improper value for "
                f"`recurrence_in_days`: {recurring.recurrence_in_days}. Converting value to None"
            )
            logger.error(msg)
            recurring.recurrence_in_days = None

        if not (
            (
                recurring.begin_date is None
                and recurring.begin_time is None
                and recurring.end_date is None
                and recurring.end_time is None
            )
            or (
                recurring.begin_date is not None
                and recurring.begin_time is not None
                and recurring.end_date is not None
                and recurring.end_time is not None
                and (
                    recurring.begin_date < recurring.end_date
                    or (recurring.begin_date == recurring.end_date and recurring.begin_time < recurring.end_time)
                )
            )
        ):
            msg = (
                f"Recurring reservation {recurring.pk} had improper combination of values "
                f"for begin and end date and times: "
                f"`begin_date`: {recurring.begin_date}, `begin_time`: {recurring.begin_time}, "
                f"`end_date`: {recurring.end_date}, `end_time`: {recurring.end_time}. "
                f"Converting all values to None"
            )
            logger.error(msg)
            recurring.begin_date = None
            recurring.begin_time = None
            recurring.end_date = None
            recurring.end_time = None

        recurring.save()


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0065_add_temp_recurring_weekdays_field"),
    ]

    operations = [
        migrations.RunPython(update_recurring_reservations, migrations.RunPython.noop),
    ]
