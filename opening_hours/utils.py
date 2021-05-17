from opening_hours.hours import get_opening_hours


def get_resources_total_hours(resource_ids, period_start, period_end):
    opening_hours = get_opening_hours(
        resource_ids,
        period_start,
        period_end,
    )
    hours_in_day = 24
    total_opening_hours = 0
    for opening_hour in opening_hours:
        for time in opening_hour["times"]:
            if time.full_day:
                total_opening_hours += hours_in_day
                continue

            if time.end_time_on_next_day:
                total_opening_hours += hours_in_day - time.start_time.hour
                continue

            total_opening_hours += time.end_time.hour - time.start_time.hour

    return total_opening_hours
