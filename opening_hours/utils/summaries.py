import datetime

from opening_hours.hours import get_opening_hours


def get_resources_total_hours(
    resource_ids: str | list[str],
    period_start: str | datetime.date,
    period_end: str | datetime.date,
):
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


def get_resources_total_hours_per_resource(
    resource_ids: str | list[str],
    period_start: str | datetime.date,
    period_end: str | datetime.date,
):
    opening_hours = get_opening_hours(
        resource_ids,
        period_start,
        period_end,
    )

    hours_in_day = 24
    total_opening_hours = {}
    for opening_hour in opening_hours:
        total_open = 0
        for time in opening_hour["times"]:
            if time.full_day:
                total_opening_hours += hours_in_day
                continue

            if time.end_time_on_next_day:
                total_opening_hours += hours_in_day - time.start_time.hour
                continue

            total_open += time.end_time.hour - time.start_time.hour

        prev_tot = total_opening_hours.get(opening_hour["resource_id"], 0)
        total_opening_hours[opening_hour["resource_id"]] = total_open + prev_tot

    return total_opening_hours
