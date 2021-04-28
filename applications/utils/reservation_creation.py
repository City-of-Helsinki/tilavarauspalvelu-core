import datetime
import logging

from django.db import Error

from reservations.models import (
    STATE_CHOICES,
    RecurringReservation,
    Reservation,
    ReservationPurpose,
)
from tilavarauspalvelu.utils.date_util import next_or_current_matching_weekday

logger = logging.getLogger(__name__)


def create_reservations_from_allocation_results(application_event):
    for schedule in application_event.application_event_schedules.all():
        create_reservation_from_schedule_result(
            schedule.application_event_schedule_result, application_event
        )


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
        start = datetime.datetime.combine(
            reservation_date,
            result.allocated_begin,
            tzinfo=result.allocated_begin.tzinfo,
        )
        end = datetime.datetime.combine(
            reservation_date,
            result.allocated_end,
            tzinfo=result.allocated_end.tzinfo,
        )
        is_overlapping = result.allocated_reservation_unit.check_reservation_overlap(
            start, end
        )
        try:
            reservation = Reservation.objects.create(
                state=STATE_CHOICES.DENIED if is_overlapping else STATE_CHOICES.CREATED,
                priority=result.application_event_schedule.priority,
                user=application_event.application.user,
                begin=start,
                end=end,
                recurring_reservation=recurring_reservation,
                num_persons=application_event.num_persons,
            )
            reservation.reservation_unit.add(result.allocated_reservation_unit)
            ReservationPurpose.objects.create(
                reservation=reservation,
                purpose=application_event.purpose,
            )
        except Error:
            logger.exception("Error while creating reservation")
        reservation_date = reservation_date + datetime.timedelta(days=interval)
