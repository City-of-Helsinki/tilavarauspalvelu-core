from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    import datetime
    from collections.abc import Iterable

    from tilavarauspalvelu.models import PriceComponent

__all__ = [
    "CoverageError",
    "check_pricing_group_coverage",
]


@dataclasses.dataclass(frozen=True, slots=True)
class CoverageError:
    code: error_codes
    message: str
    components: list[PriceComponent]
    begin: datetime.date | None
    end: datetime.date | None  # Exclusive. None means "no end".


def check_pricing_group_coverage(
    *,
    components: Iterable[PriceComponent],
    reservation_unit_begin_dates: Iterable[datetime.date],
) -> list[CoverageError]:
    """
    Check that the components of a pricing group give exactly one price on every date
    from the earliest component onward, for every price option that is offered on that date.

    :param components: All components of the pricing group, saved or not.
    :param reservation_unit_begin_dates: The begin dates of the reservation units that use the pricing group.
    """
    components = list(components)
    reservation_unit_begin_dates = sorted(reservation_unit_begin_dates)

    if not components:
        if not reservation_unit_begin_dates:
            return []

        error = CoverageError(
            code=error_codes.PRICING_GROUP_BEGINS_BEFORE_COMPONENTS,
            message="Pricing group has no prices, but a reservation unit uses it.",
            components=[],
            begin=reservation_unit_begin_dates[0],
            end=None,
        )
        return [error]

    errors: list[CoverageError] = []

    earliest_valid_from = min(component.valid_from for component in components)
    if reservation_unit_begin_dates and reservation_unit_begin_dates[0] < earliest_valid_from:
        error = CoverageError(
            code=error_codes.PRICING_GROUP_BEGINS_BEFORE_COMPONENTS,
            message=(
                f"A reservation unit uses the pricing group from {reservation_unit_begin_dates[0].isoformat()}, "
                f"but its prices begin on {earliest_valid_from.isoformat()}."
            ),
            components=[],
            begin=reservation_unit_begin_dates[0],
            end=earliest_valid_from,
        )
        errors.append(error)

    for date_range in _date_ranges(components):
        active_components = [
            component
            for component in components
            if (
                component.valid_from <= date_range.begin
                and (component.valid_until is None or component.valid_until > date_range.begin)
            )
        ]
        errors += _check_date_range(active_components=active_components, begin=date_range.begin, end=date_range.end)

    return errors


# Internals


@dataclasses.dataclass(frozen=True, slots=True)
class _DateRange:
    begin: datetime.date
    end: datetime.date | None


def _date_ranges(components: list[PriceComponent]) -> list[_DateRange]:
    """Cut time at every component boundary. The last range has no end."""
    boundaries: set[datetime.date] = set()
    for component in components:
        boundaries.add(component.valid_from)
        if component.valid_until is not None:
            boundaries.add(component.valid_until)

    sorted_boundaries = sorted(boundaries)
    range_ends: list[datetime.date | None] = [*sorted_boundaries[1:], None]
    return [_DateRange(begin=begin, end=end) for begin, end in zip(sorted_boundaries, range_ends, strict=True)]


def _check_date_range(
    *,
    active_components: list[PriceComponent],
    begin: datetime.date,
    end: datetime.date | None,
) -> list[CoverageError]:
    range_text = _format_date_range(begin=begin, end=end)

    if not active_components:
        error = CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_GAP,
            message=f"Pricing group has no price {range_text}.",
            components=[],
            begin=begin,
            end=end,
        )
        return [error]

    errors: list[CoverageError] = []

    components_for_all_options = [component for component in active_components if component.price_option_id is None]
    offered_options = {
        component.price_option_id: component.price_option
        for component in active_components
        if component.price_option_id is not None
    }

    if not offered_options and len(components_for_all_options) > 1:
        error = CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_OVERLAP,
            message=f"Pricing group has more than one price {range_text}. {_describe(components_for_all_options)}",
            components=components_for_all_options,
            begin=begin,
            end=end,
        )
        errors.append(error)

    for option_pk, option in offered_options.items():
        matching_components = [
            component
            for component in active_components
            if component.price_option_id is None or component.price_option_id == option_pk
        ]
        if len(matching_components) > 1:
            error = CoverageError(
                code=error_codes.PRICING_GROUP_COVERAGE_OVERLAP,
                message=(
                    f"Pricing group has more than one price for option '{option.name}' {range_text}. "
                    f"{_describe(matching_components)}"
                ),
                components=matching_components,
                begin=begin,
                end=end,
            )
            errors.append(error)

    paid_components = [component for component in active_components if component.amount > 0]
    payment_types = {component.payment_type for component in paid_components}
    if len(payment_types) > 1:
        error = CoverageError(
            code=error_codes.PRICING_GROUP_PAYMENT_TYPE_CONFLICT,
            message=f"All paid prices must have the same payment type {range_text}. {_describe(paid_components)}",
            components=paid_components,
            begin=begin,
            end=end,
        )
        errors.append(error)

    return errors


def _format_date_range(*, begin: datetime.date, end: datetime.date | None) -> str:
    if end is None:
        return f"from {begin.isoformat()} onward"
    return f"from {begin.isoformat()} until {end.isoformat()}"


def _describe(components: list[PriceComponent]) -> str:
    names = [
        str(component.pk) if component.pk is not None else f"new from {component.valid_from.isoformat()}"
        for component in components
    ]
    return f"Price components: {', '.join(names)}."
