from __future__ import annotations

import datetime
from decimal import Decimal
from unittest import mock

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.enums import PriceUnit
from tilavarauspalvelu.exceptions import PriceCalculationError
from tilavarauspalvelu.models import Reservation, ReservationPriceLine
from tilavarauspalvelu.services.pricing.price_lines import (
    build_price_lines,
    set_price_line_taxes,
    set_reservation_price_lines,
)
from utils.date_utils import local_datetime

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationFactory,
    ReservationPriceLineFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    TaxLevelFactory,
    TaxLevelRateFactory,
    UnitGroupFactory,
)
from tests.helpers import exact

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


JAN_1 = datetime.date(2026, 1, 1)
MAR_1 = datetime.date(2026, 3, 1)


def create_tax_level_with_rate_change():
    """A tax level with the rate 24 % until March 1st 2026 and 25.5 % after it."""
    tax_level = TaxLevelFactory.create(rates=[])
    TaxLevelRateFactory.create(tax_level=tax_level, begins=datetime.date(2000, 1, 1), percentage=Decimal(24))
    TaxLevelRateFactory.create(tax_level=tax_level, begins=MAR_1, percentage=Decimal("25.5"))
    return tax_level


# ── Build price lines ──


@freeze_time("2026-02-15T12:00:00+02:00")
def test_build_price_lines__hourly_price():
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    tax_level = create_tax_level_with_rate_change()
    component = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
        tax_level=tax_level,
    )

    # The reservation is after the rate change, but the line gets today's rate.
    result = build_price_lines(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 3, 10, 10),
        end=local_datetime(2026, 3, 10, 11, 30),
    )

    assert len(result.lines) == 1
    line = result.lines[0]
    assert line.pk is None
    assert line.price_component == component
    assert line.description_fi == ""
    assert line.description_en == ""
    assert line.description_sv == ""
    assert line.quantity == Decimal("1.5")
    assert line.price_unit == PriceUnit.PER_HOUR
    assert line.unit_amount == Decimal(10)
    assert line.amount_before_adjustment == Decimal("15.00")
    assert line.adjustment_percentage == Decimal(0)
    assert line.amount == Decimal("15.00")
    assert line.override_amount is None
    assert line.tax_level == tax_level
    assert line.tax_percentage == Decimal(24)
    assert line.vat_code == ""
    assert line.payment_product is None
    assert result.calculation.total == Decimal("15.00")


def test_build_price_lines__price_change_during_reservation_gives_two_lines():
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    old_component = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        valid_until=MAR_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )
    new_component = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=MAR_1,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
    )

    result = build_price_lines(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 28, 22),
        end=local_datetime(2026, 3, 1, 1),
    )

    assert len(result.lines) == 2
    assert result.lines[0].price_component == old_component
    assert result.lines[0].quantity == Decimal(2)
    assert result.lines[0].amount == Decimal("20.00")
    assert result.lines[1].price_component == new_component
    assert result.lines[1].quantity == Decimal(1)
    assert result.lines[1].amount == Decimal("20.00")


def test_build_price_lines__description_from_price_option():
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    option = PriceOptionFactory.create(
        unit_group=unit_group,
        name_fi="Aikuiset",
        name_en="Adults",
        name_sv="Vuxna",
    )
    other_option = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, price_option=option)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, price_option=other_option)

    result = build_price_lines(
        reservation_unit=reservation_unit,
        price_option=option,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 11),
    )

    assert len(result.lines) == 1
    assert result.lines[0].description_fi == "Aikuiset"
    assert result.lines[0].description_en == "Adults"
    assert result.lines[0].description_sv == "Vuxna"


def test_build_price_lines__no_pricing_group():
    reservation_unit = ReservationUnitFactory.create()

    msg = "Reservation unit has no pricing group on 2026-02-01."
    with pytest.raises(PriceCalculationError, match=exact(msg)):
        build_price_lines(
            reservation_unit=reservation_unit,
            price_option=None,
            begin=local_datetime(2026, 2, 1, 10),
            end=local_datetime(2026, 2, 1, 11),
        )


# ── Set reservation price lines ──


def test_set_reservation_price_lines__saves_lines_and_price():
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    component = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )
    reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2026, 2, 1, 10),
        ends_at=local_datetime(2026, 2, 1, 12),
        price=Decimal(0),
        non_subsidised_price=Decimal(0),
    )

    set_reservation_price_lines(reservation=reservation, price_option=None)

    reservation = Reservation.objects.get(pk=reservation.pk)
    assert reservation.price == Decimal("20.00")
    assert reservation.non_subsidised_price == Decimal("20.00")

    lines = list(reservation.price_lines.all())
    assert len(lines) == 1
    assert lines[0].price_component == component
    assert lines[0].quantity == Decimal(2)
    assert lines[0].amount == Decimal("20.00")


def test_set_reservation_price_lines__replaces_old_lines():
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )
    reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2026, 2, 1, 10),
        ends_at=local_datetime(2026, 2, 1, 11),
    )
    old_line = ReservationPriceLineFactory.create(
        reservation=reservation,
        amount=Decimal(50),
        override_amount=Decimal(0),
    )

    set_reservation_price_lines(reservation=reservation, price_option=None)

    assert ReservationPriceLine.objects.filter(pk=old_line.pk).exists() is False

    reservation = Reservation.objects.get(pk=reservation.pk)
    assert reservation.price == Decimal("10.00")
    assert reservation.non_subsidised_price == Decimal("10.00")

    lines = list(reservation.price_lines.all())
    assert len(lines) == 1
    assert lines[0].override_amount is None


def test_set_reservation_price_lines__nothing_changes_on_calculation_error():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2026, 2, 1, 10),
        ends_at=local_datetime(2026, 2, 1, 11),
        price=Decimal(30),
        non_subsidised_price=Decimal(30),
    )
    old_line = ReservationPriceLineFactory.create(reservation=reservation, amount=Decimal(30))

    with pytest.raises(PriceCalculationError):
        set_reservation_price_lines(reservation=reservation, price_option=None)

    assert ReservationPriceLine.objects.filter(pk=old_line.pk).exists() is True

    reservation = Reservation.objects.get(pk=reservation.pk)
    assert reservation.price == Decimal(30)
    assert reservation.non_subsidised_price == Decimal(30)


# ── Set price line taxes ──


def test_set_price_line_taxes__rate_on_the_given_date():
    tax_level = create_tax_level_with_rate_change()
    reservation = ReservationFactory.create()
    line = ReservationPriceLineFactory.create(
        reservation=reservation,
        tax_level=tax_level,
        tax_percentage=Decimal(24),
        amount=Decimal(10),
    )

    set_price_line_taxes(reservation=reservation, on_date=MAR_1)

    line.refresh_from_db()
    assert line.tax_percentage == Decimal("25.5")
    assert line.amount == Decimal(10)


def test_set_price_line_taxes__reservation_without_lines():
    reservation = ReservationFactory.create()

    set_price_line_taxes(reservation=reservation, on_date=MAR_1)

    assert not ReservationPriceLine.objects.exists()


@freeze_time("2026-03-01T12:00:00+02:00")
@override_settings(MOCK_VERKKOKAUPPA_API_ENABLED=True)
@mock.patch("tilavarauspalvelu.models.reservation.actions.create_mock_verkkokauppa_order")
def test_create_order_in_verkkokauppa__sets_price_line_taxes_on_the_order_date(create_mock_order):
    tax_level = create_tax_level_with_rate_change()
    reservation = ReservationFactory.create()
    line = ReservationPriceLineFactory.create(reservation=reservation, tax_level=tax_level, tax_percentage=Decimal(24))

    reservation.actions.create_order_in_verkkokauppa()

    assert create_mock_order.called is True

    line.refresh_from_db()
    assert line.tax_percentage == Decimal("25.5")
