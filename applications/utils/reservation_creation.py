import datetime
import logging

from django.db import Error

from applications.models import ApplicationEventSchedule
from reservations.models import (
    STATE_CHOICES,
    RecurringReservation,
    Reservation,
    ReservationPurpose,
)

logger = logging.getLogger(__name__)


def create_reservations_from_allocation_results(application_event):
    schedule_ids = application_event.values_list(
        "application_event_schedules", flat=True
    )
    schedules = ApplicationEventSchedule.objects.filter(id__in=schedule_ids)
    for schedule in schedules:
        create_reservation_from_schedule_result(
            schedule.applicationeventscheduleresult, application_event
        )


def create_reservation_from_schedule_result(result, application_event):
    recurring_reservation = RecurringReservation(
        user=application_event.application.user,
        application=application_event.application,
        age_group=result.application_event_schedule.application_event.age_group,
        ability_group=result.application_event_schedule.application_event.ability_group,
    )

    reservation_date = application_event.begin
    if not reservation_date.weekday() == result.allocated_day:
        reservation_date = reservation_date + datetime.timedelta(
            days=abs(reservation_date.weekday() - result.allocated_day)
        )
    interval = 14 if application_event.biweekly else 7
    while reservation_date < application_event.end:
        try:
            reservation = Reservation.objects.create(
                state=STATE_CHOICES.CREATED,
                priority=result.application_event_schedule.priority,
                user=application_event.application.user,
                begin=result.allocated_begin,
                end=result.allocate_end,
                reservation_unit=result.allocated_reservation_unit,
                recurring_reservation=recurring_reservation,
                num_persons=application_event.num_persons,
            )
            ReservationPurpose.objects.create(
                reservation=reservation,
                purpose=application_event.purpose,
            )
        except Error:
            logger.exception("Error while creating reservation")
        reservation_date = reservation_date + datetime.timedelta(days=interval)
