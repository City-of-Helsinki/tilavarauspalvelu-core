from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.exceptions import ApplicationRoundPricingGroupsMixedError, PriceCalculationError
from tilavarauspalvelu.models import AllocatedTimeSlot
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE, get_periods_between, next_date_matching_weekday

from .price_calculation import calculate_price_with_data, load_pricing_data

if TYPE_CHECKING:
    from collections.abc import Collection

    from tilavarauspalvelu.models import ApplicationRound, ReservationUnit

    from .price_calculation import PricingData

__all__ = [
    "RoundPriceError",
    "check_application_round_prices",
    "load_application_round_pricing",
]


@dataclasses.dataclass(frozen=True, slots=True)
class RoundPriceError:
    code: error_codes
    message: str


def load_application_round_pricing(*, reservation_units: Collection[ReservationUnit]) -> PricingData | None:
    """
    Load the pricing of the reservation units that get reservations in an application round.

    Return None if no reservation unit has a pricing group.
    Then the reservations of the round are made without prices.

    :raises ApplicationRoundPricingGroupsMixedError: If only some of the reservation units have a pricing group.
    """
    reservation_unit_pks = [reservation_unit.pk for reservation_unit in reservation_units]
    pricing_data = load_pricing_data(reservation_unit_pks=reservation_unit_pks)
    if not pricing_data.pricing_group_rows:
        return None

    units_without_pricing = sorted(
        reservation_unit.name
        for reservation_unit in reservation_units
        if reservation_unit.pk not in pricing_data.pricing_group_rows
    )
    if units_without_pricing:
        msg = (
            f"Reservation units {', '.join(units_without_pricing)} have no pricing group, "
            f"but other reservation units of the application round have one. "
            f"All reservation units must have a pricing group, or none of them."
        )
        raise ApplicationRoundPricingGroupsMixedError(msg)

    return pricing_data


def check_application_round_prices(application_round: ApplicationRound) -> list[RoundPriceError]:
    """
    Check that every reservation that the allocations of the application round give has a price.

    The reservations are priced on every weekly date of their application section's reservation period.
    Some of these dates get no reservation later, because the reservation unit is closed on them.
    Gives at most one error for each allocation.
    """
    allocations = list(
        AllocatedTimeSlot.objects
        .filter(reservation_unit_option__application_section__application__application_round=application_round)
        .select_related(
            "reservation_unit_option__reservation_unit",
            "reservation_unit_option__application_section__price_option",
        )
        .order_by("pk")
    )

    reservation_units = {
        allocation.reservation_unit_option.reservation_unit.pk: allocation.reservation_unit_option.reservation_unit
        for allocation in allocations
    }

    try:
        pricing_data = load_application_round_pricing(reservation_units=list(reservation_units.values()))
    except ApplicationRoundPricingGroupsMixedError as error:
        return [RoundPriceError(code=error_codes.APPLICATION_ROUND_PRICING_GROUPS_MIXED, message=str(error))]

    if pricing_data is None:
        return []

    errors: list[RoundPriceError] = []

    for allocation in allocations:
        section = allocation.reservation_unit_option.application_section
        reservation_unit = allocation.reservation_unit_option.reservation_unit

        weekday = Weekday(allocation.day_of_the_week)
        first_date = next_date_matching_weekday(section.reservations_begin_date, weekday)
        if first_date > section.reservations_end_date:
            continue

        periods = get_periods_between(
            start_date=first_date,
            end_date=section.reservations_end_date,
            start_time=allocation.begin_time,
            end_time=allocation.end_time,
            tzinfo=DEFAULT_TIMEZONE,
        )

        for begin, end in periods:
            try:
                calculate_price_with_data(
                    pricing_data=pricing_data,
                    reservation_unit=reservation_unit,
                    price_option=section.price_option,
                    begin=begin,
                    end=end,
                )
            except PriceCalculationError as error:
                msg = (
                    f"Application section '{section.name}' has no price in reservation unit "
                    f"'{reservation_unit.name}' on {begin.date().isoformat()}: {error}"
                )
                errors.append(RoundPriceError(code=error_codes.APPLICATION_ROUND_PRICE_MISSING, message=msg))
                break

    return errors
