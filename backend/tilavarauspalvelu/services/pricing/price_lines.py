from __future__ import annotations

import dataclasses
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import transaction

from tilavarauspalvelu.models import ReservationPriceLine
from utils.decimal_utils import round_decimal

from .price_calculation import calculate_price

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import PriceOption, Reservation, ReservationUnit

    from .price_calculation import PriceCalculation

__all__ = [
    "PriceLines",
    "build_price_lines",
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
    calculation = calculate_price(
        reservation_unit=reservation_unit,
        price_option=price_option,
        begin=begin,
        end=end,
    )

    lines: list[ReservationPriceLine] = []
    for calculation_line in calculation.lines:
        component = calculation_line.component

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
            tax_percentage=Decimal(0),
            vat_code="",
            payment_product=None,
        )
        lines.append(line)

    return PriceLines(lines=lines, calculation=calculation)


def set_reservation_price_lines(*, reservation: Reservation, price_option: PriceOption | None) -> None:
    """
    Replace the price lines of the reservation, and set its price from them.

    :raises PriceCalculationError: If the price cannot be calculated. Nothing is changed then.
    """
    price_lines = build_price_lines(
        reservation_unit=reservation.reservation_unit,
        price_option=price_option,
        begin=reservation.begins_at,
        end=reservation.ends_at,
    )

    for line in price_lines.lines:
        line.reservation = reservation

    price = Decimal(0)
    non_subsidised_price = Decimal(0)
    for line in price_lines.lines:
        price += line.amount if line.override_amount is None else line.override_amount
        non_subsidised_price += line.amount

    reservation.price = price
    reservation.non_subsidised_price = non_subsidised_price

    with transaction.atomic():
        reservation.price_lines.all().delete()
        ReservationPriceLine.objects.bulk_create(price_lines.lines)
        reservation.save(update_fields=["price", "non_subsidised_price"])
