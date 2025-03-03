from __future__ import annotations

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued
from tilavarauspalvelu.models import RecurringReservation

from tests.factories import RecurringReservationFactory, ReservationFactory

pytestmark = [
    pytest.mark.django_db,
]


def test__recurring_reservation__access_type__single():
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


def test__recurring_reservation__access_type__zero():
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


def test__recurring_reservation__access_type__multiple_same():
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


def test__recurring_reservation__access_type__multiple_different():
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
