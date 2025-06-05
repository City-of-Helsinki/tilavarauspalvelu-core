from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import (
    AccessType,
    ApplicationRoundStatusChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import AllocatedTimeSlot, Reservation, ReservationSeries, ReservationUnitOption

from tests.factories import AllocatedTimeSlotFactory, ApplicationFactory, ApplicationRoundFactory, ReservationFactory
from tests.helpers import patch_method

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
        reservation_unit_option__is_locked=True,
        reservation_unit_option__application_section__application__application_round=application_round,
    )

    assert AllocatedTimeSlot.objects.count() == 2
    assert ReservationUnitOption.objects.count() == 2
    assert ReservationUnitOption.objects.filter(is_locked=True).count() == 1

    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    application_round.actions.reset_application_round_allocation()

    # Still in allocation, but allocations and locks removed
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert AllocatedTimeSlot.objects.count() == 0
    assert ReservationUnitOption.objects.count() == 2
    assert ReservationUnitOption.objects.filter(is_locked=True).count() == 0


def test_reset_application_round_allocation__handled():
    application_round = ApplicationRoundFactory.create_in_status_handled()

    allocation_1 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__is_locked=True,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    ReservationFactory.create(
        type=ReservationTypeChoice.SEASONAL,
        reservation_series__allocated_time_slot=allocation_1,
    )
    ReservationFactory.create(
        type=ReservationTypeChoice.SEASONAL,
        reservation_series__allocated_time_slot=allocation_2,
    )

    assert AllocatedTimeSlot.objects.count() == 2
    assert ReservationUnitOption.objects.count() == 2
    assert ReservationSeries.objects.count() == 2
    assert Reservation.objects.count() == 2
    assert ReservationUnitOption.objects.filter(is_locked=True).count() == 1
    assert application_round.handled_at is not None

    assert application_round.status == ApplicationRoundStatusChoice.HANDLED

    application_round.actions.reset_application_round_allocation()

    # Still has allocations and locks, but reservations are removed
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert AllocatedTimeSlot.objects.count() == 2
    assert ReservationUnitOption.objects.count() == 2
    assert ReservationSeries.objects.count() == 0
    assert Reservation.objects.count() == 0
    assert ReservationUnitOption.objects.filter(is_locked=True).count() == 1
    assert application_round.handled_at is None


@patch_method(PindoraService.delete_access_code)
def test_reset_application_round_allocation__handled__call_pindora_if_has_access_codes():
    application_round = ApplicationRoundFactory.create_in_status_handled()

    allocation_1 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__is_locked=True,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        reservation_series__allocated_time_slot=allocation_1,
    )
    ReservationFactory.create(
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        reservation_series__allocated_time_slot=allocation_2,
    )

    application_round.actions.reset_application_round_allocation()

    assert PindoraService.delete_access_code.call_count == 1


def test_reset_application_round_allocation__results_sent():
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create_in_status_results_sent(application_round=application_round)

    application_round.actions.reset_application_round_allocation()

    application_round.refresh_from_db()
    application.refresh_from_db()

    assert application_round.status == ApplicationRoundStatusChoice.HANDLED
    assert application.results_ready_notification_sent_at is None
