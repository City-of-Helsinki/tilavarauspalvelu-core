from __future__ import annotations

import dataclasses
import datetime
import math
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import PriceUnit
from tilavarauspalvelu.exceptions import PriceCalculationError
from tilavarauspalvelu.models import PriceComponent, ReservationUnitPricingGroup, TaxLevelRate
from utils.date_utils import DEFAULT_TIMEZONE, local_start_of_day
from utils.decimal_utils import round_decimal

if TYPE_CHECKING:
    from collections.abc import Collection

    from tilavarauspalvelu.enums import PaymentType
    from tilavarauspalvelu.models import PriceOption, ReservationUnit, TaxLevel

__all__ = [
    "PriceCalculation",
    "PriceCalculationLine",
    "PricingData",
    "calculate_price",
    "calculate_price_with_data",
    "load_pricing_data",
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


@dataclasses.dataclass(frozen=True, slots=True)
class PricingData:
    """The pricing of a set of reservation units, so that their prices can be calculated without queries."""

    pricing_group_rows: dict[int, list[ReservationUnitPricingGroup]]
    """The pricing group rows of each reservation unit, from the latest to the earliest."""

    components: dict[int, list[PriceComponent]]
    """The price components of each pricing group, ordered by their start date."""

    tax_rates: dict[int, list[TaxLevelRate]]
    """The rates of each tax level, from the latest to the earliest."""

    def pricing_group_row(self, *, reservation_unit_pk: int, on_date: datetime.date) -> ReservationUnitPricingGroup:
        """
        Return the pricing group row that the reservation unit uses on the given date.

        :raises PriceCalculationError: If the reservation unit has no pricing group on the date.
        """
        for row in self.pricing_group_rows.get(reservation_unit_pk, []):
            if row.begins <= on_date:
                return row

        msg = f"Reservation unit has no pricing group on {on_date.isoformat()}."
        raise PriceCalculationError(msg)

    def tax_percentage(self, *, tax_level: TaxLevel, on_date: datetime.date) -> Decimal:
        """
        Return the percentage of the rate of the tax level that is in effect on the given date.

        :raises PriceCalculationError: If the tax level has no rate on the date.
        """
        for rate in self.tax_rates.get(tax_level.pk, []):
            if rate.begins <= on_date:
                return rate.percentage

        msg = f"Tax level '{tax_level}' has no rate on {on_date.isoformat()}."
        raise PriceCalculationError(msg)


def load_pricing_data(*, reservation_unit_pks: Collection[int]) -> PricingData:
    """Load the pricing of the given reservation units with a fixed number of queries."""
    rows = list(
        ReservationUnitPricingGroup.objects
        .filter(reservation_unit__in=reservation_unit_pks)
        .select_related("pricing_group")
        .order_by("-begins")
    )
    pricing_group_rows: dict[int, list[ReservationUnitPricingGroup]] = {}
    for row in rows:
        pricing_group_rows.setdefault(row.reservation_unit_id, []).append(row)

    pricing_group_pks = {row.pricing_group_id for row in rows}
    component_list = list(
        PriceComponent.objects
        .filter(pricing_group__in=pricing_group_pks)
        .select_related("tax_level", "sales_item")
        .order_by("valid_from")
    )
    components: dict[int, list[PriceComponent]] = {}
    for component in component_list:
        components.setdefault(component.pricing_group_id, []).append(component)

    tax_level_pks = {component.tax_level_id for component in component_list}
    rate_list = list(TaxLevelRate.objects.filter(tax_level__in=tax_level_pks).order_by("-begins"))
    tax_rates: dict[int, list[TaxLevelRate]] = {}
    for rate in rate_list:
        tax_rates.setdefault(rate.tax_level_id, []).append(rate)

    return PricingData(pricing_group_rows=pricing_group_rows, components=components, tax_rates=tax_rates)


def calculate_price(
    *,
    reservation_unit: ReservationUnit,
    price_option: PriceOption | None,
    begin: datetime.datetime,
    end: datetime.datetime,
) -> PriceCalculation:
    """
    Calculate the price of a reservation. See `calculate_price_with_data`.

    :raises PriceCalculationError: If the price cannot be calculated.
    """
    pricing_data = load_pricing_data(reservation_unit_pks=[reservation_unit.pk])
    return calculate_price_with_data(
        pricing_data=pricing_data,
        reservation_unit=reservation_unit,
        price_option=price_option,
        begin=begin,
        end=end,
    )


def calculate_price_with_data(
    *,
    pricing_data: PricingData,
    reservation_unit: ReservationUnit,
    price_option: PriceOption | None,
    begin: datetime.datetime,
    end: datetime.datetime,
) -> PriceCalculation:
    """
    Calculate the price of a reservation from the pricing group that the reservation unit uses on its start date.
    The pricing comes from `pricing_data`, so this makes no queries.

    The reservation is walked through from its begin. Each step is priced by the component that is active
    on the date of the step's start:
    - A minute-based unit counts the minutes until the next local midnight or the end of the reservation.
    - A unit of half a day or longer counts one started unit, even if the unit goes over a price change.
    - A fixed price counts once and covers the rest of the reservation.

    The duration of the reservation is rounded up to the next 15 minutes.
    Durations are real time, so a night with a daylight saving change is one hour shorter or longer.
    Day and week units follow the local calendar, so a day with a daylight saving change is one day.

    :raises PriceCalculationError: If the reservation unit has no pricing group, the price option belongs to
                                   another unit group, or there is no price on a date.
    """
    # Python counts the difference of two datetimes with the same timezone in wall time, so count in UTC.
    begin = begin.astimezone(datetime.UTC)
    end = end.astimezone(datetime.UTC)
    if begin >= end:
        msg = "Reservation must end after it begins."
        raise PriceCalculationError(msg)

    begin_date = begin.astimezone(DEFAULT_TIMEZONE).date()
    reservation_unit_pricing_group = pricing_data.pricing_group_row(
        reservation_unit_pk=reservation_unit.pk,
        on_date=begin_date,
    )

    pricing_group = reservation_unit_pricing_group.pricing_group
    if price_option is not None and price_option.unit_group_id != pricing_group.unit_group_id:
        msg = "Price option does not belong to the unit group of the pricing group."
        raise PriceCalculationError(msg)

    price_option_pk = price_option.pk if price_option is not None else None
    components = [
        component
        for component in pricing_data.components.get(pricing_group.pk, [])
        if component.price_option_id is None or component.price_option_id == price_option_pk
    ]

    # Same rounding as in the old pricing model (`ReservationUnitPricingActions.calculate_reservation_price`).
    duration_minutes = math.ceil((end - begin).total_seconds() / 60 / 15) * 15
    end = begin + datetime.timedelta(minutes=duration_minutes)

    quantities: dict[int, Decimal] = {}
    components_by_pk: dict[int, PriceComponent] = {}

    moment = begin

    while moment < end:
        moment_date = moment.astimezone(DEFAULT_TIMEZONE).date()
        component = _component_for_date(components=components, date=moment_date)
        components_by_pk[component.pk] = component
        quantity = quantities.get(component.pk, Decimal(0))
        price_unit = PriceUnit(component.price_unit)

        if price_unit == PriceUnit.FIXED:
            quantities[component.pk] = quantity + 1
            break

        if price_unit in {PriceUnit.PER_HALF_DAY, PriceUnit.PER_DAY, PriceUnit.PER_WEEK}:
            quantities[component.pk] = quantity + 1
            moment = _start_of_next_unit(moment=moment, price_unit=price_unit)
            continue

        next_midnight = local_start_of_day(moment_date + datetime.timedelta(days=1)).astimezone(datetime.UTC)
        step_end = min(next_midnight, end)
        step_minutes = Decimal(int((step_end - moment).total_seconds()) // 60)
        quantities[component.pk] = quantity + step_minutes / price_unit.in_minutes
        moment = step_end

    lines: list[PriceCalculationLine] = []
    for pk, quantity in quantities.items():
        component = components_by_pk[pk]
        amount = round_decimal(component.amount * quantity, 2)
        line = PriceCalculationLine(
            component=component,
            quantity=quantity,
            unit_amount=component.amount,
            amount=amount,
        )
        lines.append(line)

    total = sum((line.amount for line in lines), start=Decimal(0))
    can_apply_for_discount = any(line.component.can_apply_for_discount for line in lines)

    payment_type = reservation_unit.payment_type if total > 0 else None

    return PriceCalculation(
        lines=lines,
        total=total,
        payment_type=payment_type,
        can_apply_for_discount=can_apply_for_discount,
    )


# Internals


def _component_for_date(*, components: list[PriceComponent], date: datetime.date) -> PriceComponent:
    for component in components:
        if component.valid_from <= date and (component.valid_until is None or component.valid_until > date):
            return component

    msg = f"Reservation unit has no price on {date.isoformat()}."
    raise PriceCalculationError(msg)


def _start_of_next_unit(*, moment: datetime.datetime, price_unit: PriceUnit) -> datetime.datetime:
    unit_length = datetime.timedelta(minutes=price_unit.in_minutes)
    if price_unit == PriceUnit.PER_HALF_DAY:
        return moment + unit_length

    # Python adds to a datetime with a zoneinfo timezone in wall time, so a day stays a calendar day.
    local_moment = moment.astimezone(DEFAULT_TIMEZONE)
    next_local_moment = local_moment + unit_length
    return next_local_moment.astimezone(datetime.UTC)
