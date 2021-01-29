import datetime

from django.utils import timezone

from applications.models import Application, ApplicationEvent
from reservation_units.models import ReservationUnit


class AvailableTime(object):
    def __init__(self, start: int, end: int):
        self.start = start
        self.end = end


# Used to control precision of allocation. Currently we allocate at 15 minute precision
ALLOCATION_PRECISION = 15


class AllocationSpace(object):
    def __init__(
        self,
        id: int,
        period_start: datetime.date,
        period_end: datetime.date,
        times: [AvailableTime],
    ):
        self.id = id
        self._period_start = period_start
        self._period_end = period_end
        self.available_times: [AvailableTime] = times

    def add_time(self, start: datetime, end: datetime):
        start_delta = round(
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
            ).total_seconds()
            // 60
            // ALLOCATION_PRECISION
        )
        end_delta = round(
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
            ).total_seconds()
            // 60
            // ALLOCATION_PRECISION
        )
        self.available_times.append(AvailableTime(start_delta, end_delta))


class AllocationEvent(object):
    def __init__(self, application_event: ApplicationEvent):
        self.id = application_event.id
        self.occurrences = application_event.get_occurrences()


class AllocationData(object):
    def __init__(self, application: Application):
        self.spaces: [AllocationSpace] = []
        self.period_start: datetime.date = (
            application.application_period.reservation_period_begin
        )
        self.period_end: datetime.date = (
            application.application_period.reservation_period_end
        )
        for unit in application.application_period.reservation_units.all():
            self.add_space(unit=unit)

        self.allocation_events = []
        for application_event in application.application_events.all():
            self.allocation_events.append(AllocationEvent(application_event))

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
            id=unit.id,
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
        self.spaces.append(space)
