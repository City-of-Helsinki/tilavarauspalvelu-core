import datetime
import math
from typing import Dict, List, Optional

from django.utils import timezone

from applications.models import EventOccurrence
from reservation_units.models import ReservationUnit
from tilavarauspalvelu.utils.date_util import next_or_current_matching_weekday

TIMEZONE = timezone.get_default_timezone()


class AvailableTime(object):
    def __init__(self, start: int, end: int):
        self.start = start
        self.end = end


# Used to control precision of allocation. Currently we allocate at 15 minute precision
ALLOCATION_PRECISION = 15


def time_delta_to_integer_with_precision(delta: datetime.timedelta):
    return math.ceil(delta.total_seconds() / 60 / ALLOCATION_PRECISION)


class AllocationSpace(object):
    """Would like to have some proper definition here"""

    def __init__(
        self,
        unit: ReservationUnit,
        period_start: datetime.date,
        period_end: datetime.date,
    ):
        self.id = unit.id
        self._period_start = period_start
        self._period_end = period_end
        self.available_times: Dict[datetime.date, AvailableTime] = {}
        self.max_persons = unit.get_max_persons()

    def add_time(self, start: datetime, end: datetime):
        start_delta = time_delta_to_integer_with_precision(
            (
                start
                - datetime.datetime(
                    year=self._period_start.year,
                    month=self._period_start.month,
                    day=self._period_start.day,
                    hour=0,
                    minute=0,
                    second=0,
                    tzinfo=TIMEZONE,
                )
            )
        )
        end_delta = time_delta_to_integer_with_precision(
            (
                end
                - datetime.datetime(
                    year=self._period_start.year,
                    month=self._period_start.month,
                    day=self._period_start.day,
                    hour=0,
                    minute=0,
                    second=0,
                    tzinfo=TIMEZONE,
                )
            )
        )
        self.available_times[start.date()] = AvailableTime(start_delta, end_delta)


class AllocationOccurrence(object):
    """Would like to have some proper definition here"""

    def __init__(
        self,
        occurrence: EventOccurrence,
        period_start: datetime.date,
        event_begin: datetime.date,
    ):
        first_date = next_or_current_matching_weekday(event_begin, occurrence.weekday)
        self.first_date = first_date
        date_diff = time_delta_to_integer_with_precision(first_date - period_start)
        self.weekday = occurrence.weekday
        self.begin = (
            time_delta_to_integer_with_precision(
                datetime.datetime.combine(datetime.date.min, occurrence.begin)
                - datetime.datetime.min
            )
            + date_diff
        )
        self.end = (
            time_delta_to_integer_with_precision(
                datetime.datetime.combine(datetime.date.min, occurrence.end)
                - datetime.datetime.min
            )
            + date_diff
        )
        self.occurrences = occurrence.occurrences


class AllocationEvent(object):
    """Would like to have some proper definition here"""

    def __init__(
        self,
        id: int,
        occurrences: Dict[int, List[EventOccurrence]],
        period_start: datetime.date,
        period_end: datetime.date,
        space_ids: [int],
        begin: datetime.date,
        end: datetime.date,
        min_duration: datetime.timedelta,
        max_duration: datetime.timedelta,
        events_per_week: int,
        num_persons: int,
        baskets: [int] = [],
    ):
        self.space_ids = space_ids
        self.id = id
        self.begin = begin
        self.end = end
        self.period_start = period_start
        self.period_end = period_end
        self.occurrences = self.occurrences_to_integers_with_precision(occurrences)
        self.min_duration = time_delta_to_integer_with_precision(min_duration)
        self.max_duration = time_delta_to_integer_with_precision(max_duration)
        self.events_per_week = events_per_week
        self.num_persons = num_persons
        if baskets is None:
            self.baskets = []
        else:
            self.baskets = baskets

    def occurrences_to_integers_with_precision(
        self, occurrences: Dict[int, EventOccurrence]
    ) -> Dict[int, AllocationOccurrence]:
        allocation_occurrences = {}
        for occurrence_id, occurrence in occurrences.items():
            allocation_occurrences[occurrence_id] = AllocationOccurrence(
                occurrence, self.period_start, self.begin
            )
        return allocation_occurrences


class AllocationBasket(object):
    """Would like to have some proper definition here"""

    def __init__(
        self,
        id: int,
        order_number: int,
        allocation_percentage: Optional[int],
        events: [AllocationEvent],
        score: int,
    ):
        self.id = id
        self.allocation_percentage = allocation_percentage
        self.order_number = order_number
        self.events = events
        self.score = score


class AllocationData(object):
    """Would like to have some proper definition here"""

    def __init__(
        self,
        period_start: datetime.date,
        period_end: datetime.date,
        baskets: Dict[int, List[AllocationBasket]],
        spaces: Dict[int, List[AllocationSpace]],
        output_basket_ids: [int] = [],
    ):
        self.period_start = period_start
        self.period_end = period_end
        self.spaces = spaces
        self.baskets = baskets
        self.output_basket_ids = output_basket_ids


class AllocatedEvent(object):
    """Would like to have some proper definition here"""

    def __init__(
        self,
        space: AllocationSpace,
        event: AllocationEvent,
        duration: int,
        occurrence_id: int,
        event_id: int,
        start: datetime.time,
        end: datetime.time,
        basket: AllocationBasket,
    ):
        self.space_id = space.id  # Note; this is a ReservationUnit id.
        self.event_id = event.id
        self.duration = datetime.timedelta(minutes=duration * ALLOCATION_PRECISION)
        self.occurrence_id = occurrence_id
        self.begin = start
        self.end = end
        self.basket_id = basket.id
        self.event_id = event_id

    def __str__(self):
        return "{} {} {} {} {} {} {}".format(
            self.space_id,
            self.event_id,
            self.duration,
            self.occurrence_id,
            self.begin,
            self.end,
            self.basket_id,
        )
