from __future__ import annotations

from decimal import Decimal

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import ReservationSeries
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationSeriesFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_series__access_type__single() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(reservation_series=series, access_type=AccessType.ACCESS_CODE)

    # Test non-ORM code
    assert series.access_type == AccessType.ACCESS_CODE
    assert series.used_access_types == [AccessType.ACCESS_CODE]

    series = ReservationSeries.objects.annotate(
        orm_used_access_types=L("used_access_types"),
        orm_access_type=L("access_type"),
    ).get()

    # Test ORM code
    assert series.orm_access_type == AccessType.ACCESS_CODE
    assert series.orm_used_access_types == [AccessType.ACCESS_CODE]


def test_reservation_series__access_type__zero() -> None:
    series = ReservationSeriesFactory.create()

    # Test non-ORM code
    assert series.access_type == AccessType.UNRESTRICTED
    assert series.used_access_types == []

    series = ReservationSeries.objects.annotate(
        orm_used_access_types=L("used_access_types"),
        orm_access_type=L("access_type"),
    ).get()

    # Test ORM code
    assert series.orm_access_type == AccessType.UNRESTRICTED
    assert series.orm_used_access_types == []


def test_reservation_series__access_type__multiple_same() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(reservation_series=series, access_type=AccessType.PHYSICAL_KEY)
    ReservationFactory.create(reservation_series=series, access_type=AccessType.PHYSICAL_KEY)

    # Test non-ORM code
    assert series.access_type == AccessType.PHYSICAL_KEY
    assert series.used_access_types == [AccessType.PHYSICAL_KEY]

    series = ReservationSeries.objects.annotate(
        orm_used_access_types=L("used_access_types"),
        orm_access_type=L("access_type"),
    ).get()

    # Test ORM code
    assert series.orm_access_type == AccessType.PHYSICAL_KEY
    assert series.orm_used_access_types == [AccessType.PHYSICAL_KEY]


def test_reservation_series__access_type__multiple_different() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(reservation_series=series, access_type=AccessType.PHYSICAL_KEY)
    ReservationFactory.create(reservation_series=series, access_type=AccessType.ACCESS_CODE)

    # Test non-ORM code
    assert series.access_type == AccessTypeWithMultivalued.MULTIVALUED
    assert series.used_access_types == [AccessType.ACCESS_CODE, AccessType.PHYSICAL_KEY]

    series = ReservationSeries.objects.annotate(
        orm_used_access_types=L("used_access_types"),
        orm_access_type=L("access_type"),
    ).get()

    # Test ORM code
    assert series.orm_access_type == AccessTypeWithMultivalued.MULTIVALUED
    assert series.orm_used_access_types == [AccessType.ACCESS_CODE, AccessType.PHYSICAL_KEY]


def test_reservation_series__access_type__only_going_to_occur() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.PHYSICAL_KEY,
        state=ReservationStateChoice.CANCELLED,
    )
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
    )

    # Test non-ORM code
    assert series.access_type == AccessTypeWithMultivalued.ACCESS_CODE
    assert series.used_access_types == [AccessType.ACCESS_CODE]

    series = ReservationSeries.objects.annotate(
        orm_used_access_types=L("used_access_types"),
        orm_access_type=L("access_type"),
    ).get()

    # Test ORM code
    assert series.orm_access_type == AccessTypeWithMultivalued.ACCESS_CODE
    assert series.orm_used_access_types == [AccessType.ACCESS_CODE]


def test_reservation_series__should_have_active_access_code__active() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert series.should_have_active_access_code is True


def test_reservation_series__should_have_active_access_code__blocked() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
    )

    assert series.should_have_active_access_code is False


def test_reservation_series__should_have_active_access_code__not_confirmed() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CREATED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert series.should_have_active_access_code is False


def test_reservation_series__should_have_active_access_code__not_access_code() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    assert series.should_have_active_access_code is False


def test_reservation_series__access_code_is_active_correct__active_when_should_be() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    assert series.is_access_code_is_active_correct is True


def test_reservation_series__access_code_is_active_correct__active_when_should_not_be() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    assert series.is_access_code_is_active_correct is False


def test_reservation_series__access_code_is_active_correct__inactive_when_should_be() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
    )

    assert series.is_access_code_is_active_correct is True


def test_reservation_series__access_code_is_active_correct__inactive_when_should_not_be() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
    )

    assert series.is_access_code_is_active_correct is False


def test_reservation_series__total_price__reservations_going_to_occur() -> None:
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CONFIRMED,
        price_lines__amount=Decimal(10),
    )
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.REQUIRES_HANDLING,
        price_lines__amount=Decimal(30),
        price_lines__override_amount=Decimal(20),
    )
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CANCELLED,
        price_lines__amount=Decimal(100),
    )

    # Test non-ORM code
    assert series.total_price == Decimal("30.00")

    series = ReservationSeries.objects.annotate(orm_total_price=L("total_price")).get()

    # Test ORM code
    assert series.orm_total_price == Decimal("30.00")


def test_reservation_series__total_price__no_reservations() -> None:
    series = ReservationSeriesFactory.create()

    # Test non-ORM code
    assert series.total_price == Decimal("0.00")

    series = ReservationSeries.objects.annotate(orm_total_price=L("total_price")).get()

    # Test ORM code
    assert series.orm_total_price == Decimal("0.00")
