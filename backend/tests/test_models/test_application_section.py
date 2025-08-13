from __future__ import annotations

import datetime

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import (
    AccessType,
    ApplicationSectionStatusChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.models import ApplicationSection
from utils.date_utils import local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    ReservationFactory,
    ReservationUnitOptionFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__status():
    now = local_datetime()
    application_round = ApplicationRoundFactory.create(
        application_period_begins_at=now - datetime.timedelta(days=7),
        application_period_ends_at=now + datetime.timedelta(days=1),
    )
    section = ApplicationSectionFactory.create(
        application__application_round=application_round,
        applied_reservations_per_week=2,
    )
    option = ReservationUnitOptionFactory.create(application_section=section)

    assert ApplicationSection.objects.count() == 1  # sanity check

    # Application round is still option -> status is UNALLOCATED
    assert section.status == ApplicationSectionStatusChoice.UNALLOCATED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.UNALLOCATED)).exists()

    # Application round has entered allocation -> status is IN_ALLOCATION
    application_round.application_period_ends_at = now - datetime.timedelta(days=1)
    application_round.save()
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.IN_ALLOCATION)).exists()

    # 1/2 allocations have been made -> status is IN_ALLOCATION
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.IN_ALLOCATION)).exists()

    # 1/2 allocations have been made, but application round has been handled -> status is HANDLED
    application_round.handled_at = now
    application_round.save()
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()
    application_round.handled_at = None
    application_round.save()

    # All reservation unit options have been locked -> status is HANDLED
    option.is_locked = True
    option.save()
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()
    option.is_locked = False
    option.save()

    # All reservation unit options have been rejected -> status is HANDLED
    option.is_rejected = True
    option.save()
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()
    option.is_rejected = False
    option.save()

    # 2/2 allocations have been made -> status is HANDLED
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()


def test_application_section__status__partially_allocated__option_unusable():
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    section = ApplicationSectionFactory.create(
        application__application_round=application_round,
        applied_reservations_per_week=2,
    )
    option = ReservationUnitOptionFactory.create(application_section=section, is_locked=True)

    assert section.status == ApplicationSectionStatusChoice.REJECTED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.REJECTED)).exists()

    option.is_locked = False
    option.is_rejected = True
    option.save()

    assert section.status == ApplicationSectionStatusChoice.REJECTED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.REJECTED)).exists()

    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()


def test_application_section__allocations():
    section_1 = ApplicationSectionFactory.create()
    option_1 = ReservationUnitOptionFactory.create(application_section=section_1, reservation_unit__name="foo 0")

    # Sanity check
    assert ApplicationSection.objects.count() == 1

    # Application section has 0 allocations
    assert section_1.allocations == 0
    assert ApplicationSection.objects.filter(L(allocations=0)).exists()

    # Application section has 1 allocation
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_1)
    assert section_1.allocations == 1
    assert ApplicationSection.objects.filter(L(allocations=1)).exists()

    option_2 = ReservationUnitOptionFactory.create(application_section=section_1, reservation_unit__name="foo 1")
    option_3 = ReservationUnitOptionFactory.create(application_section=section_1, reservation_unit__name="foo 2")

    AllocatedTimeSlotFactory.create(reservation_unit_option=option_2, day_of_the_week=Weekday.MONDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_2, day_of_the_week=Weekday.TUESDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_2, day_of_the_week=Weekday.WEDNESDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_3, day_of_the_week=Weekday.MONDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_3, day_of_the_week=Weekday.TUESDAY)

    section = (
        ApplicationSection.objects.annotate(allocations=L("allocations"))
        .filter(reservation_unit_options__reservation_unit__name__startswith="foo")
        .order_by("pk")
        .first()
    )

    assert section.allocations == 6


def test_application_section__usable_reservation_unit_options():
    section = ApplicationSectionFactory.create()

    # Sanity check
    assert ApplicationSection.objects.count() == 1

    # Application section has 0 usable reservation unit options
    assert section.usable_reservation_unit_options == 0
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=0)).exists()

    # Create one option -> Application section has 1 usable reservation unit options
    option = ReservationUnitOptionFactory.create(application_section=section)
    assert section.usable_reservation_unit_options == 1
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=1)).exists()

    # Reservation unit locked -> Application section has 0 usable reservation unit options
    option.is_locked = True
    option.save()
    assert section.usable_reservation_unit_options == 0
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=0)).exists()
    option.is_locked = False
    option.save()

    # Reservation unit rejected -> Application section has 0 usable reservation unit options
    option.is_rejected = True
    option.save()
    assert section.usable_reservation_unit_options == 0
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=0)).exists()

    # Create second option -> Application section has 1 usable reservation unit options
    ReservationUnitOptionFactory.create(application_section=section)
    assert section.usable_reservation_unit_options == 1
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=1)).exists()


def test_application_section__should_have_active_access_code__active():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert section.should_have_active_access_code is True


def test_application_section__should_have_active_access_code__blocked():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
    )

    assert section.should_have_active_access_code is False


def test_application_section__should_have_active_access_code__not_confirmed():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CREATED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert section.should_have_active_access_code is False


def test_application_section__is_access_code_is_active_correct__active_when_should_be():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    assert section.is_access_code_is_active_correct is True


def test_application_section__is_access_code_is_active_correct__active_when_should_not_be():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    assert section.is_access_code_is_active_correct is False


def test_application_section__is_access_code_is_active_correct__inactive_when_should_not_be():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
    )

    assert section.is_access_code_is_active_correct is False


def test_application_section__is_access_code_is_active_correct__inactive_when_should_be():
    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
    )

    assert section.is_access_code_is_active_correct is True
