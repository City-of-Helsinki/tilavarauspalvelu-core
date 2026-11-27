from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, ReservationUnitReservationState
from tilavarauspalvelu.models import ReservationUnit

from tests.factories import PaymentMerchantFactory, PriceComponentFactory, ReservationUnitFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_get_state__scheduled_reservation():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_ends_at = None

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_RESERVATION


def test_reservation_unit__get_state__scheduled_period():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=2)
    reservation_unit.reservation_begins_at = now + datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_PERIOD


def test_reservation_unit_get_state__reservable__free():
    reservation_unit: ReservationUnit = ReservationUnitFactory(own_price__amount=Decimal(0))
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVABLE


def test_reservation_unit_get_state__reservable__paid():
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVABLE


def test_reservation_unit_get_state__not_reservable_due_to_missing_pricing():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_reservable_due_to_missing_payment_product():
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=PaymentType.ONLINE,
    )
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_reservable__free_base_price_with_paid_surcharge_and_no_payment_product():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(0),
        payment_type=PaymentType.ONLINE,
        reservation_begins_at=now - datetime.timedelta(days=1),
        reservation_ends_at=None,
    )
    pricing_group = reservation_unit.reservation_unit_pricing_groups.get().pricing_group
    PriceComponentFactory.create(pricing_group=pricing_group, kind=PriceComponentKind.SURCHARGE, amount=Decimal(5))

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED

    queryset = ReservationUnit.objects.filter(pk=reservation_unit.pk).annotate(state=L("reservation_state"))
    assert queryset.values_list("state", flat=True).get() == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_reservable__no_payment_type_and_no_payment_product():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=None,
        reservation_begins_at=now - datetime.timedelta(days=1),
        reservation_ends_at=None,
    )

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED

    queryset = ReservationUnit.objects.filter(pk=reservation_unit.pk).annotate(state=L("reservation_state"))
    assert queryset.values_list("state", flat=True).get() == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservable__paid_on_site_without_payment_product():
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=PaymentType.ON_SITE,
    )
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVABLE


def test_reservation_unit_get_state__not_reservable__payment_product_of_other_merchant():
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )
    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.save()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__scheduled_closing__free():
    reservation_unit: ReservationUnit = ReservationUnitFactory(own_price__amount=Decimal(0))
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_CLOSING


def test_reservation_unit_get_state__scheduled_closing__paid():
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_CLOSING


def test_reservation_unit_get_state__not_scheduled_due_to_missing_pricing():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_scheduled_due_to_no_payment_product():
    reservation_unit: ReservationUnit = ReservationUnitFactory(
        own_price__amount=Decimal(10),
        payment_type=PaymentType.ONLINE,
    )
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__begins_is_in_past():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now - datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=2)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__begins_is_none():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now - datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = None

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_now_same_value():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now
    reservation_unit.reservation_ends_at = reservation_unit.reservation_begins_at

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_in_past_and_same_value():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    reservation_unit.reservation_ends_at = reservation_unit.reservation_begins_at

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_in_future_and_same_value():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_ends_at = reservation_unit.reservation_begins_at

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED
