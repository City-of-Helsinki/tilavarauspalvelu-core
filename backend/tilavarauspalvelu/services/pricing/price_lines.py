from __future__ import annotations

import dataclasses
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import transaction

from tilavarauspalvelu.models import ReservationPriceLine
from utils.date_utils import local_date
from utils.decimal_utils import round_decimal

from .price_calculation import calculate_price_with_data, load_pricing_data

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import PriceOption, Reservation, ReservationUnit

    from .price_calculation import PriceCalculation, PricingData

__all__ = [
    "PriceLines",
    "build_price_lines",
    "build_price_lines_with_data",
    "save_reservation_price_lines",
    "set_price_line_taxes",
    "set_reservation_price_lines",
]


@dataclasses.dataclass(frozen=True, slots=True)
class PriceLines:
    lines: list[ReservationPriceLine]
    calculation: PriceCalculation


def build_price_lines(
    *,
    reservation_unit: ReservationUnit,
    price_option: PriceOption | None,
    begin: datetime.datetime,
    end: datetime.datetime,
) -> PriceLines:
    """
    Make the unsaved price lines that a reservation with the given input gets.

    :raises PriceCalculationError: If the price cannot be calculated.
    """
    pricing_data = load_pricing_data(reservation_unit_pks=[reservation_unit.pk])
    return build_price_lines_with_data(
        pricing_data=pricing_data,
        reservation_unit=reservation_unit,
        price_option=price_option,
        begin=begin,
        end=end,
    )


def build_price_lines_with_data(
    *,
    pricing_data: PricingData,
    reservation_unit: ReservationUnit,
    price_option: PriceOption | None,
    begin: datetime.datetime,
    end: datetime.datetime,
) -> PriceLines:
    """
    Make the unsaved price lines that a reservation with the given input gets.
    The pricing comes from `pricing_data`, so this makes no queries.

    :raises PriceCalculationError: If the price cannot be calculated.
    """
    calculation = calculate_price_with_data(
        pricing_data=pricing_data,
        reservation_unit=reservation_unit,
        price_option=price_option,
        begin=begin,
        end=end,
    )

    today = local_date()

    lines: list[ReservationPriceLine] = []
    for calculation_line in calculation.lines:
        component = calculation_line.component
        tax_level = component.tax_level

        # The calculation keeps only components with no option or with the selected option.
        line_option = price_option if component.price_option_id is not None else None

        line = ReservationPriceLine(
            price_component=component,
            description_fi=line_option.name_fi if line_option is not None else "",
            description_en=line_option.name_en if line_option is not None else "",
            description_sv=line_option.name_sv if line_option is not None else "",
            quantity=round_decimal(calculation_line.quantity, 4),
            price_unit=component.price_unit,
            unit_amount=calculation_line.unit_amount,
            amount_before_adjustment=calculation_line.amount,
            adjustment_percentage=Decimal(0),
            amount=calculation_line.amount,
            override_amount=None,
            sales_item=component.sales_item,
            tax_level=tax_level,
            tax_percentage=pricing_data.tax_percentage(tax_level=tax_level, on_date=today),
            vat_code="",
            payment_product=None,
        )
        lines.append(line)

    return PriceLines(lines=lines, calculation=calculation)


def set_reservation_price_lines(*, reservation: Reservation, price_option: PriceOption | None) -> None:
    """
    Replace the price lines of the reservation.

    :raises PriceCalculationError: If the price cannot be calculated. Nothing is changed then.
    """
    price_lines = build_price_lines(
        reservation_unit=reservation.reservation_unit,
        price_option=price_option,
        begin=reservation.begins_at,
        end=reservation.ends_at,
    )
    save_reservation_price_lines(reservation=reservation, price_lines=price_lines)


def save_reservation_price_lines(*, reservation: Reservation, price_lines: PriceLines) -> None:
    """Replace the price lines of the reservation with the given unsaved lines."""
    for line in price_lines.lines:
        line.reservation = reservation

    with transaction.atomic():
        reservation.price_lines.all().delete()
        ReservationPriceLine.objects.bulk_create(price_lines.lines)


def set_price_line_taxes(*, reservation: Reservation, on_date: datetime.date) -> None:
    """
    Set the tax percentage of each price line of the reservation from the rate of its tax level on the given date.
    The amounts do not change. A reservation without price lines does not change.

    :raises TaxLevelHasNoRateError: If a tax level has no rate on the given date.
    """
    price_lines: list[ReservationPriceLine] = list(reservation.price_lines.select_related("tax_level"))
    if not price_lines:
        return

    for line in price_lines:
        line.tax_percentage = line.tax_level.actions.get_percentage(on_date=on_date)

    ReservationPriceLine.objects.bulk_update(price_lines, fields=["tax_percentage"])
