from __future__ import annotations

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import RecurringReservation
from utils.date_utils import local_datetime

from tests.factories import RecurringReservationFactory, ReservationFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservation__access_type__single():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=series, access_type=AccessType.ACCESS_CODE)

    # Test non-ORM code
    assert series.access_type == AccessType.ACCESS_CODE
    assert series.used_access_types == [AccessType.ACCESS_CODE]

    series = RecurringReservation.objects.annotate(
        used_access_types=L("used_access_types"),
        access_type=L("access_type"),
    ).first()

    # Test ORM code
    assert series.access_type == AccessType.ACCESS_CODE
    assert series.used_access_types == [AccessType.ACCESS_CODE]


def test_recurring_reservation__access_type__zero():
    series = RecurringReservationFactory.create()

    # Test non-ORM code
    assert series.access_type == AccessType.UNRESTRICTED
    assert series.used_access_types == []

    series = RecurringReservation.objects.annotate(
        used_access_types=L("used_access_types"),
        access_type=L("access_type"),
    ).first()

    # Test ORM code
    assert series.access_type == AccessType.UNRESTRICTED
    assert series.used_access_types == []


def test_recurring_reservation__access_type__multiple_same():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=series, access_type=AccessType.PHYSICAL_KEY)
    ReservationFactory.create(recurring_reservation=series, access_type=AccessType.PHYSICAL_KEY)

    # Test non-ORM code
    assert series.access_type == AccessType.PHYSICAL_KEY
    assert series.used_access_types == [AccessType.PHYSICAL_KEY]

    series = RecurringReservation.objects.annotate(
        used_access_types=L("used_access_types"),
        access_type=L("access_type"),
    ).first()

    # Test ORM code
    assert series.access_type == AccessType.PHYSICAL_KEY
    assert series.used_access_types == [AccessType.PHYSICAL_KEY]


def test_recurring_reservation__access_type__multiple_different():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=series, access_type=AccessType.PHYSICAL_KEY)
    ReservationFactory.create(recurring_reservation=series, access_type=AccessType.ACCESS_CODE)

    # Test non-ORM code
    assert series.access_type == AccessTypeWithMultivalued.MULTIVALUED
    assert series.used_access_types == [AccessType.ACCESS_CODE, AccessType.PHYSICAL_KEY]

    series = RecurringReservation.objects.annotate(
        used_access_types=L("used_access_types"),
        access_type=L("access_type"),
    ).first()

    # Test ORM code
    assert series.access_type == AccessTypeWithMultivalued.MULTIVALUED
    assert series.used_access_types == [AccessType.ACCESS_CODE, AccessType.PHYSICAL_KEY]


def test_recurring_reservation__access_type__only_going_to_occur():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.PHYSICAL_KEY,
        state=ReservationStateChoice.CANCELLED,
    )
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
    )

    # Test non-ORM code
    assert series.access_type == AccessTypeWithMultivalued.ACCESS_CODE
    assert series.used_access_types == [AccessType.ACCESS_CODE]

    series = RecurringReservation.objects.annotate(
        used_access_types=L("used_access_types"),
        access_type=L("access_type"),
    ).first()

    # Test ORM code
    assert series.access_type == AccessTypeWithMultivalued.ACCESS_CODE
    assert series.used_access_types == [AccessType.ACCESS_CODE]


def test_recurring_reservation__should_have_active_access_code__active():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert series.should_have_active_access_code is True


def test_recurring_reservation__should_have_active_access_code__blocked():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
    )

    assert series.should_have_active_access_code is False


def test_recurring_reservation__should_have_active_access_code__not_confirmed():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CREATED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert series.should_have_active_access_code is False


def test_recurring_reservation__should_have_active_access_code__not_access_code():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert series.should_have_active_access_code is False


def test_recurring_reservation__access_code_is_active_correct__active_when_should_be():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    assert series.is_access_code_is_active_correct is True


def test_recurring_reservation__access_code_is_active_correct__active_when_should_not_be():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    assert series.is_access_code_is_active_correct is False


def test_recurring_reservation__access_code_is_active_correct__inactive_when_should_be():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
    )

    assert series.is_access_code_is_active_correct is True


def test_recurring_reservation__access_code_is_active_correct__inactive_when_should_not_be():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
    )

    assert series.is_access_code_is_active_correct is False
