import datetime
from typing import TYPE_CHECKING

import pytest

from reservation_units.enums import PricingType, ReservationState
from reservation_units.utils.reservation_unit_reservation_state_helper import ReservationUnitReservationStateHelper
from tests.factories import PaymentProductFactory, ReservationUnitFactory, ReservationUnitPricingFactory

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_get_state__scheduled_reservation():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins = now + datetime.timedelta(days=1)
    reservation_unit.reservation_ends = None

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.SCHEDULED_RESERVATION


def test_reservation_unit__get_state__scheduled_period():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now + datetime.timedelta(days=2)
    reservation_unit.reservation_begins = now + datetime.timedelta(days=1)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.SCHEDULED_PERIOD


def test_reservation_unit_get_state__reservable__free():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = None
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, pricing_type=PricingType.FREE)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVABLE


def test_reservation_unit_get_state__reservable__paid():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = None
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    reservation_unit.payment_product = PaymentProductFactory.create()
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, pricing_type=PricingType.PAID)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVABLE


def test_reservation_unit_get_state__not_reservable_due_to_missing_pricing():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = None
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_reservable_due_to_missing_payment_product():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = None
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, pricing_type=PricingType.PAID)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__scheduled_closing__free():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, pricing_type=PricingType.FREE)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.SCHEDULED_CLOSING


def test_reservation_unit_get_state__scheduled_closing__paid():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    reservation_unit.payment_product = PaymentProductFactory.create()
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, pricing_type=PricingType.PAID)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.SCHEDULED_CLOSING


def test_reservation_unit_get_state__not_scheduled_due_to_missing_pricing():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__not_scheduled_due_to_no_payment_product():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now + datetime.timedelta(days=1)
    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, pricing_type=PricingType.PAID)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__begins_is_in_past():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now - datetime.timedelta(days=1)
    reservation_unit.reservation_begins = now - datetime.timedelta(days=2)

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__begins_is_none():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_ends = now - datetime.timedelta(days=1)
    reservation_unit.reservation_begins = None

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_now_same_value():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins = now
    reservation_unit.reservation_ends = reservation_unit.reservation_begins

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_in_past_and_same_value():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins = now - datetime.timedelta(days=1)
    reservation_unit.reservation_ends = reservation_unit.reservation_begins

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED


def test_reservation_unit_get_state__reservation_closed__reservation_begin_and_end_in_future_and_same_value():
    reservation_unit: ReservationUnit = ReservationUnitFactory()
    now = datetime.datetime.now(tz=datetime.UTC)

    reservation_unit.reservation_begins = now + datetime.timedelta(days=1)
    reservation_unit.reservation_ends = reservation_unit.reservation_begins

    assert ReservationUnitReservationStateHelper.get_state(reservation_unit) == ReservationState.RESERVATION_CLOSED
