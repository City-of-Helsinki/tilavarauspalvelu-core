import datetime
from typing import Set

from django.utils.timezone import get_default_timezone

from opening_hours.utils.opening_hours_client import OpeningHoursClient

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationUnitReservationScheduler:
    APRIL = 4

    def __init__(
        self,
        reservation_unit,
        opening_hours_end: datetime.date = None,
    ):
        self.reservation_unit = reservation_unit

        if self.reservation_unit.max_reservation_duration:
            self.reservation_duration = (
                self.reservation_unit.max_reservation_duration.total_seconds() / 3600
            )
        else:
            self.reservation_duration = 1

        self.start_time = DEFAULT_TIMEZONE.localize(
            datetime.datetime.now()
        ) + datetime.timedelta(hours=2)
        self.end_time = self.start_time + datetime.timedelta(
            hours=self.reservation_duration
        )
        self.reservation_date_end = self._get_reservation_period_end(self.start_time)

        self.opening_hours_client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            self.start_time.date(),
            opening_hours_end or self.reservation_date_end,
            single=True,
        )

    def get_next_available_reservation_time(self) -> (datetime, datetime):
        self.start_time = self._get_next_matching_opening_hour_start_time(
            self.start_time
        )
        if not self.start_time:
            return None, None

        self.end_time = self.start_time + datetime.timedelta(
            hours=self.reservation_duration
        )
        is_reservation_unit_closed = not self.opening_hours_client.is_resource_open(
            str(self.reservation_unit.uuid), self.start_time, self.end_time
        )
        open_application_round = self.get_conflicting_open_application_round(
            self.start_time.date(), self.end_time.date()
        )
        is_overlapping = self.reservation_unit.check_reservation_overlap(
            self.start_time, self.end_time
        )

        while is_overlapping or open_application_round or is_reservation_unit_closed:
            if open_application_round:
                self.start_time = (
                    open_application_round.reservation_period_end
                    + datetime.timedelta(days=1)
                )
                self.start_time = DEFAULT_TIMEZONE.localize(
                    datetime.datetime(
                        self.start_time.year,
                        self.start_time.month,
                        self.start_time.day,
                        0,
                        0,
                    )
                )

            else:
                self.start_time = self.start_time + datetime.timedelta(hours=1)

            self.end_time = self.start_time + datetime.timedelta(
                hours=self.reservation_duration
            )

            is_overlapping = self.reservation_unit.check_reservation_overlap(
                self.start_time, self.end_time
            )
            open_application_round = self.get_conflicting_open_application_round(
                self.start_time.date(), self.end_time.date()
            )
            is_reservation_unit_closed = not self.opening_hours_client.is_resource_open(
                str(self.reservation_unit.uuid), self.start_time, self.end_time
            )

            if self.reservation_date_end < self.start_time.date():
                return None, None

        return self.start_time, self.end_time

    def get_conflicting_open_application_round(
        self, start: datetime.date, end: datetime.date
    ):
        from applications.models import ApplicationRound, ApplicationRoundStatus

        for app_round in ApplicationRound.objects.filter(
            reservation_units=self.reservation_unit,
            reservation_period_end__gte=end,
            reservation_period_begin__lte=start,
        ):
            if app_round.status not in ApplicationRoundStatus.CLOSED_STATUSES:
                return app_round

        return None

    def _get_reservation_period_end(self, start: datetime.date) -> datetime.date:
        if start.month < self.APRIL:
            end = datetime.date(start.year, self.APRIL, 30)
        else:
            end = datetime.date(start.year + 1, self.APRIL, 30)
        return end

    def _get_next_matching_opening_hour_start_time(self, start: datetime.datetime):
        matching = None
        while not matching:
            open_date, times = self.opening_hours_client.next_opening_times(
                str(self.reservation_unit.uuid), start.date()
            )
            if not times:
                break
            try:
                opening_hours = sorted([time.start_time for time in times])
                for start_time in [
                    start_time for start_time in opening_hours if start_time >= start
                ]:
                    matching = start_time
            except ValueError:
                continue
            start = datetime.timedelta(days=1)

        return matching

    def is_reservation_unit_open(
        self, start: datetime.datetime, end: datetime.datetime
    ):
        return self.opening_hours_client.is_resource_open(
            str(self.reservation_unit.uuid), start, end
        )

    def get_reservation_unit_possible_start_times(
        self, date: datetime.date, interval: datetime.timedelta
    ) -> Set[datetime.datetime]:
        opening_hours = self.opening_hours_client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            datetime.date(date.year, date.month, date.day),
        )
        possible_start_times = set()
        for opening_hour in opening_hours:
            start_time = opening_hour.start_time
            while start_time < opening_hour.end_time:
                possible_start_times.add(start_time)
                start_time += interval
        return possible_start_times
