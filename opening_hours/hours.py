import datetime

from opening_hours.models import ReservableTimeSpan


def can_reserve_based_on_opening_hours(
    reservable_time_spans: list[ReservableTimeSpan],
    reservation_start: datetime.datetime,
    reservation_end: datetime.datetime,
) -> bool:
    """Clamp the given reservation start and end times based on the given opening hours."""
    for time_span in reservable_time_spans:
        # Find the first opening time on the reservation period
        if time_span.start_datetime < reservation_end and time_span.end_datetime > reservation_start:
            max_start = max(time_span.start_datetime, reservation_start)
            min_end = min(time_span.end_datetime, reservation_end)

            # If the reservation period is not fully contained in the time span, we can't reserve
            if max_start > reservation_start:
                return False
            if min_end < reservation_end:
                return False
            return True

    # Don't know if opening hours exists, so assume we can't get what we want
    return False
