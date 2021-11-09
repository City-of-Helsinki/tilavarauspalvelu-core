import datetime
import logging

from django.db import Error
from django.utils.timezone import get_default_timezone

from applications.utils.aggregate_data import (
    ApplicationAggregateDataCreator,
    ApplicationRoundAggregateDataCreator,
)
from opening_hours.hours import get_opening_hours
from reservations.models import STATE_CHOICES, RecurringReservation, Reservation
from tilavarauspalvelu.utils.date_util import next_or_current_matching_weekday

logger = logging.getLogger(__name__)


def create_reservations_from_allocation_results(application_event):
    scheduled_schedules = [
        schedule
        for schedule in application_event.application_event_schedules.all()
        if hasattr(schedule, "application_event_schedule_result")
    ]
    for schedule in scheduled_schedules:
        create_reservation_from_schedule_result(
            schedule.application_event_schedule_result, application_event
        )
    ApplicationRoundAggregateDataCreator(
        application_event.application.application_round, reservations_only=True
    ).start()
    ApplicationAggregateDataCreator(application_event.application).start()


def create_reservation_from_schedule_result(result, application_event):
    recurring_reservation = RecurringReservation.objects.create(
        user=application_event.application.user,
        application=application_event.application,
        application_event=application_event,
        age_group=result.application_event_schedule.application_event.age_group,
        ability_group=result.application_event_schedule.application_event.ability_group,
    )

    reservation_date = next_or_current_matching_weekday(
        application_event.begin, result.allocated_day
    )

    interval = 14 if application_event.biweekly else 7
    while reservation_date < application_event.end:
        res_start = datetime.datetime.combine(
            reservation_date,
            result.allocated_begin,
            tzinfo=get_default_timezone(),
        )
        res_end = datetime.datetime.combine(
            reservation_date,
            result.allocated_end,
            tzinfo=get_default_timezone(),
        )
        is_overlapping = result.allocated_reservation_unit.check_reservation_overlap(
            res_start, res_end
        )

        reservation_scheduler = ReservationScheduler(
            result.allocated_reservation_unit, res_start, res_end
        )
        (
            start,
            end,
        ) = reservation_scheduler.get_reservation_times_based_on_opening_hours()
        is_unit_closed = start is None

        try:
            reservation = Reservation.objects.create(
                state=STATE_CHOICES.DENIED
                if is_overlapping or is_unit_closed
                else STATE_CHOICES.CREATED,
                priority=result.application_event_schedule.priority,
                user=application_event.application.user,
                begin=start if not is_unit_closed else res_start,
                end=end if not is_unit_closed else res_end,
                recurring_reservation=recurring_reservation,
                num_persons=application_event.num_persons,
                purpose=application_event.purpose,
            )
            reservation.reservation_unit.add(result.allocated_reservation_unit)
        except Error:
            logger.exception("Error while creating reservation")
        reservation_date = reservation_date + datetime.timedelta(days=interval)


class ReservationScheduler:
    def __init__(self, reservation_unit, begin, end):
        self.reservation_unit = reservation_unit
        self.begin = begin
        self.end = end
        self.dates = []

        self.is_multiple_days_reservation = self.begin.date() < self.end.date()
        if self.is_multiple_days_reservation:
            loop_date = self.begin.date()
            while loop_date <= self.end.date():
                self.dates.append(loop_date)
                loop_date += datetime.timedelta(days=1)

    def get_reservation_times_based_on_opening_hours(self):
        """Returns amount of time that the reservation unit is open on selected datetime range."""
        opening_hours = self.get_opening_hours()
        for opening_hour in opening_hours:
            opening_hour_date = opening_hour["date"]
            for time in opening_hour["times"]:
                if (
                    opening_hour_date == self.begin.date()
                    and not self.is_multiple_days_reservation
                ):
                    return self._get_datetimes_for_the_day(opening_hour_date, time)

                # Assume opening hours are sorted properly.
                if (
                    self.is_multiple_days_reservation
                    and opening_hour_date in self.dates
                ):
                    if not time.end_time == datetime.time(
                        23, 59, tzinfo=get_default_timezone()
                    ):
                        return self._get_datetimes_for_the_day(self.begin.date(), time)
                    for date in self.dates[1:]:
                        if self.can_continue_to_next_day(date, time):
                            continue
                        _, end = self._get_datetimes_for_the_day(date, time)
                        return self.begin, end
        return None, None

    def _get_datetimes_for_the_day(self, date, time):
        start_dt = datetime.datetime.combine(
            date, time.start_time, tzinfo=get_default_timezone()
        )
        end_dt = datetime.datetime.combine(
            date, time.end_time, tzinfo=get_default_timezone()
        )

        starts_in_opening_hours = start_dt <= self.begin
        ends_in_opening_hours = end_dt >= self.end
        if starts_in_opening_hours and ends_in_opening_hours:
            return self.begin, self.end
        if starts_in_opening_hours and not ends_in_opening_hours:
            return self.begin, end_dt
        if not starts_in_opening_hours and ends_in_opening_hours:
            return start_dt, self.end

        return None, None

    def can_continue_to_next_day(self, date, time):
        last_date = len(self.dates) - 1
        return (
            self.dates.index(date) < last_date and time.hour == 23 and time.hour == 59
        )

    def get_opening_hours(self):
        # TODO: Cache opening hours per unit.
        return get_opening_hours(
            self.reservation_unit.uuid,
            start_date=self.begin.date(),
            end_date=self.end.date(),
        )
