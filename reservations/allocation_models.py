import datetime
import math
from typing import Dict

from django.utils import timezone

from applications.models import ApplicationEvent, ApplicationRound, EventOccurrence
from reservation_units.models import ReservationUnit


class AvailableTime(object):
    def __init__(self, start: int, end: int):
        self.start = start
        self.end = end


# Used to control precision of allocation. Currently we allocate at 15 minute precision
ALLOCATION_PRECISION = 15


def time_delta_to_integer_with_precision(delta: datetime.timedelta):
    return math.ceil(delta.total_seconds() / 60 / ALLOCATION_PRECISION)


class AllocationSpace(object):
    def __init__(
        self,
        unit: ReservationUnit,
        period_start: datetime.date,
        period_end: datetime.date,
        times: [AvailableTime],
    ):
        self.id = unit.id
        self._period_start = period_start
        self._period_end = period_end
        self.available_times: [AvailableTime] = times
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
                    tzinfo=timezone.get_default_timezone(),
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
                    tzinfo=timezone.get_default_timezone(),
                )
            )
        )
        self.available_times.append(AvailableTime(start_delta, end_delta))


class AllocationOccurrence(object):
    def __init__(self, occurrence: EventOccurrence):
        self.weekday = occurrence.weekday
        self.begin = time_delta_to_integer_with_precision(
            datetime.datetime.combine(datetime.date.min, occurrence.begin)
            - datetime.datetime.min
        )
        self.end = time_delta_to_integer_with_precision(
            datetime.datetime.combine(datetime.date.min, occurrence.end)
            - datetime.datetime.min
        )
        self.occurrences = occurrence.occurrences


class AllocationEvent(object):
    def __init__(
        self,
        application_event: ApplicationEvent,
        period_start: datetime.date,
        period_end: datetime.date,
    ):
        self.space_ids = list(
            map(
                lambda x: x.reservation_unit.id,
                application_event.event_reservation_units.all(),
            )
        )
        self.id = application_event.id
        self.occurrences = self.occurrences_to_integers_with_precision(
            application_event.get_all_occurrences()
        )
        self.begin = application_event.begin
        self.end = application_event.begin
        self.period_start = period_start
        self.period_end = period_end
        self.min_duration = time_delta_to_integer_with_precision(
            application_event.min_duration
        )
        self.max_duration = time_delta_to_integer_with_precision(
            application_event.max_duration
            if application_event.max_duration is not None
            else application_event.min_duration
        )
        self.events_per_week = application_event.events_per_week
        self.num_persons = application_event.num_persons

    @staticmethod
    def occurrences_to_integers_with_precision(
        occurrences: Dict[int, EventOccurrence]
    ) -> Dict[int, int]:
        allocation_occurrences = {}
        for occurrence_id, occurrence in occurrences.items():
            allocation_occurrences[occurrence_id] = AllocationOccurrence(occurrence)
        return allocation_occurrences


class AllocationData(object):
    def __init__(self, application_round: ApplicationRound):
        self.spaces: dict[int, AllocationSpace] = {}
        self.period_start: datetime.date = application_round.reservation_period_begin
        self.period_end: datetime.date = application_round.reservation_period_end
        for unit in application_round.reservation_units.all():
            self.add_space(unit=unit)

        self.allocation_events = []
        for application in application_round.applications.all():
            for application_event in application.application_events.all():
                self.allocation_events.append(
                    AllocationEvent(
                        application_event, self.period_start, self.period_end
                    )
                )

    def get_all_dates(self):
        dates = []
        start = self.period_start
        delta = datetime.timedelta(days=1)
        while start <= self.period_end:
            dates.append(start)
            start += delta
        return dates

    def add_space(self, unit: ReservationUnit):
        all_dates = self.get_all_dates()
        space = AllocationSpace(
            unit=unit,
            period_start=self.period_start,
            period_end=self.period_end,
            times=[],
        )
        # TODO: This is hardcoded for now so we can go ahead with this
        # replace with dates from models when it's implemented
        for the_date in all_dates:
            space.add_time(
                start=datetime.datetime(
                    the_date.year,
                    the_date.month,
                    the_date.day,
                    hour=10,
                    tzinfo=timezone.get_default_timezone(),
                ),
                end=datetime.datetime(
                    the_date.year,
                    the_date.month,
                    the_date.day,
                    hour=22,
                    tzinfo=timezone.get_default_timezone(),
                ),
            )
        self.spaces[space.id] = space
