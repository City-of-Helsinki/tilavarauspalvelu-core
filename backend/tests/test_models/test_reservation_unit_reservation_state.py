from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import ReservationUnitReservationState

from tests.factories import PaymentProductFactory, ReservationUnitFactory, ReservationUnitPricingFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_get_state__scheduled_reservation():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_ends_at = None

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_RESERVATION


def test_reservation_unit__get_state__scheduled_period():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=2)
    reservation_unit.reservation_begins_at = now + datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_PERIOD


def test_reservation_unit_get_state__reservable__free():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create_free(reservation_unit=reservation_unit)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVABLE


def test_reservation_unit_get_state__reservable__paid():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    reservation_unit.payment_product = PaymentProductFactory.create()
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVABLE


def test_reservation_unit_get_state__not_reservable_due_to_missing_pricing():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_reservable_due_to_missing_payment_product():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = None
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__scheduled_closing__free():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create_free(reservation_unit=reservation_unit)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_CLOSING


def test_reservation_unit_get_state__scheduled_closing__paid():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    reservation_unit.payment_product = PaymentProductFactory.create()
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.SCHEDULED_CLOSING


def test_reservation_unit_get_state__not_scheduled_due_to_missing_pricing():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_scheduled_due_to_no_payment_product():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__begins_is_in_past():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now - datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=2)

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__begins_is_none():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends_at = now - datetime.timedelta(days=1)
    reservation_unit.reservation_begins_at = None

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_now_same_value():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now
    reservation_unit.reservation_ends_at = reservation_unit.reservation_begins_at

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_in_past_and_same_value():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now - datetime.timedelta(days=1)
    reservation_unit.reservation_ends_at = reservation_unit.reservation_begins_at

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_in_future_and_same_value():
    reservation_unit = ReservationUnitFactory.create()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins_at = now + datetime.timedelta(days=1)
    reservation_unit.reservation_ends_at = reservation_unit.reservation_begins_at

    assert reservation_unit.reservation_state == ReservationUnitReservationState.RESERVATION_CLOSED
