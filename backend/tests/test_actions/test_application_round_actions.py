from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ReservationTypeChoice
from tilavarauspalvelu.models import AllocatedTimeSlot, RecurringReservation, Reservation, ReservationUnitOption

from tests.factories import AllocatedTimeSlotFactory, ApplicationFactory, ApplicationRoundFactory, ReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reset_application_round_allocation__in_allocation():
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()

    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__locked=True,
        reservation_unit_option__application_section__application__application_round=application_round,
    )

    assert AllocatedTimeSlot.objects.count() == 2
    assert ReservationUnitOption.objects.count() == 2
    assert ReservationUnitOption.objects.filter(locked=True).count() == 1

    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    application_round.actions.reset_application_round_allocation()

    # Still in allocation, but allocations and locks removed
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert AllocatedTimeSlot.objects.count() == 0
    assert ReservationUnitOption.objects.count() == 2
    assert ReservationUnitOption.objects.filter(locked=True).count() == 0


def test_reset_application_round_allocation__handled():
    application_round = ApplicationRoundFactory.create_in_status_handled()

    allocation_1 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__locked=True,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    ReservationFactory.create(
        type=ReservationTypeChoice.SEASONAL,
        recurring_reservation__allocated_time_slot=allocation_1,
    )
    ReservationFactory.create(
        type=ReservationTypeChoice.SEASONAL,
        recurring_reservation__allocated_time_slot=allocation_2,
    )

    assert AllocatedTimeSlot.objects.count() == 2
    assert ReservationUnitOption.objects.count() == 2
    assert RecurringReservation.objects.count() == 2
    assert Reservation.objects.count() == 2
    assert ReservationUnitOption.objects.filter(locked=True).count() == 1
    assert application_round.handled_date is not None

    assert application_round.status == ApplicationRoundStatusChoice.HANDLED

    application_round.actions.reset_application_round_allocation()

    # Still has allocations and locks, but reservations are removed
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert AllocatedTimeSlot.objects.count() == 2
    assert ReservationUnitOption.objects.count() == 2
    assert RecurringReservation.objects.count() == 0
    assert Reservation.objects.count() == 0
    assert ReservationUnitOption.objects.filter(locked=True).count() == 1
    assert application_round.handled_date is None


def test_reset_application_round_allocation__results_sent():
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create_in_status_results_sent(application_round=application_round)

    application_round.actions.reset_application_round_allocation()

    application_round.refresh_from_db()
    application.refresh_from_db()

    assert application_round.status == ApplicationRoundStatusChoice.HANDLED
    assert application.results_ready_notification_sent_date is None
