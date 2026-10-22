from __future__ import annotations

import dataclasses
import datetime
import math
from decimal import ROUND_HALF_UP, Decimal
from typing import TYPE_CHECKING

from django.db import models

from tilavarauspalvelu.enums import PriceUnit
from tilavarauspalvelu.exceptions import PriceCalculationError
from tilavarauspalvelu.models import PriceComponent, ReservationUnitPricingGroup
from utils.date_utils import DEFAULT_TIMEZONE, local_start_of_day

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import PaymentType
    from tilavarauspalvelu.models import PriceOption, ReservationUnit

__all__ = [
    "PriceCalculation",
    "PriceCalculationLine",
    "calculate_price",
]


@dataclasses.dataclass(frozen=True, slots=True)
class PriceCalculationLine:
    component: PriceComponent
    quantity: Decimal
    unit_amount: Decimal
    amount: Decimal


@dataclasses.dataclass(frozen=True, slots=True)
class PriceCalculation:
    lines: list[PriceCalculationLine]
    total: Decimal
    payment_type: PaymentType | None
    can_apply_for_discount: bool


def calculate_price(
    *,
    reservation_unit: ReservationUnit,
    price_option: PriceOption | None,
    begin: datetime.datetime,
    end: datetime.datetime,
) -> PriceCalculation:
    """
    Calculate the price of a reservation from the pricing group that the reservation unit uses on its start date.

    The reservation is walked through from its begin. Each step is priced by the component that is active
    on the date of the step's start:
    - A minute-based unit counts the minutes until the next local midnight or the end of the reservation.
    - A unit of half a day or longer counts one started unit, even if the unit goes over a price change.
    - A fixed price counts once and covers the rest of the reservation.

    The duration of the reservation is rounded up to the next 15 minutes.

    :raises PriceCalculationError: If the reservation unit has no pricing group or no price on a date.
    """
    begin = begin.astimezone(DEFAULT_TIMEZONE)
    end = end.astimezone(DEFAULT_TIMEZONE)
    if begin >= end:
        msg = "Reservation must end after it begins."
        raise PriceCalculationError(msg)

    begin_date = begin.date()
    reservation_unit_pricing_group = (
        ReservationUnitPricingGroup.objects
        .filter(reservation_unit=reservation_unit, begins__lte=begin_date)
        .order_by("-begins")
        .select_related("pricing_group")
        .first()
    )
    if reservation_unit_pricing_group is None:
        msg = f"Reservation unit has no pricing group on {begin_date.isoformat()}."
        raise PriceCalculationError(msg)

    option_filter = models.Q(price_option__isnull=True)
    if price_option is not None:
        option_filter |= models.Q(price_option=price_option)

    components = list(
        PriceComponent.objects.filter(
            option_filter, pricing_group=reservation_unit_pricing_group.pricing_group
        ).order_by("valid_from")
    )

    duration_minutes = math.ceil((end - begin).total_seconds() / 60 / 15) * 15
    end = begin + datetime.timedelta(minutes=duration_minutes)

    quantities: dict[int, Decimal] = {}
    components_by_pk: dict[int, PriceComponent] = {}

    start_component = _component_for_date(components=components, date=begin_date)
    moment = begin

    while moment < end:
        component = _component_for_date(components=components, date=moment.date())
        components_by_pk[component.pk] = component
        quantity = quantities.get(component.pk, Decimal(0))
        price_unit = PriceUnit(component.price_unit)

        if price_unit == PriceUnit.FIXED:
            quantities[component.pk] = quantity + 1
            break

        if price_unit in {PriceUnit.PER_HALF_DAY, PriceUnit.PER_DAY, PriceUnit.PER_WEEK}:
            quantities[component.pk] = quantity + 1
            moment += datetime.timedelta(minutes=price_unit.in_minutes)
            continue

        next_midnight = local_start_of_day(moment.date() + datetime.timedelta(days=1))
        step_end = min(next_midnight, end)
        step_minutes = Decimal(int((step_end - moment).total_seconds()) // 60)
        quantities[component.pk] = quantity + step_minutes / price_unit.in_minutes
        moment = step_end

    lines: list[PriceCalculationLine] = []
    for pk, quantity in quantities.items():
        component = components_by_pk[pk]
        amount = (component.amount * quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        line = PriceCalculationLine(
            component=component,
            quantity=quantity,
            unit_amount=component.amount,
            amount=amount,
        )
        lines.append(line)

    return PriceCalculation(
        lines=lines,
        total=sum((line.amount for line in lines), start=Decimal(0)),
        payment_type=start_component.payment_type,
        can_apply_for_discount=any(line.component.can_apply_for_discount for line in lines),
    )


# Internals


def _component_for_date(*, components: list[PriceComponent], date: datetime.date) -> PriceComponent:
    for component in components:
        if component.valid_from <= date and (component.valid_until is None or component.valid_until > date):
            return component

    msg = f"Reservation unit has no price on {date.isoformat()}."
    raise PriceCalculationError(msg)
