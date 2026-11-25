from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from utils.date_utils import local_add_days, local_date, local_datetime, local_start_of_day

from .price_summary import summarize_prices

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from .price_summary import BasePrice, PriceSummary

__all__ = [
    "PriceChange",
    "ScheduledBasePrice",
    "ScheduledPricingGroup",
    "ScheduledSurcharge",
    "find_next_price_change",
]


@dataclasses.dataclass(frozen=True, slots=True)
class ScheduledBasePrice:
    base_price: BasePrice
    valid_from: datetime.date
    valid_until: datetime.date | None  # Exclusive


@dataclasses.dataclass(frozen=True, slots=True)
class ScheduledSurcharge:
    amount: Decimal
    valid_from: datetime.date
    valid_until: datetime.date | None  # Exclusive


@dataclasses.dataclass(frozen=True, slots=True)
class ScheduledPricingGroup:
    begins: datetime.date
    base_prices: list[ScheduledBasePrice]
    surcharges: list[ScheduledSurcharge]


@dataclasses.dataclass(frozen=True, slots=True)
class PriceChange:
    begins: datetime.date
    summary: PriceSummary


def find_next_price_change(
    *,
    pricing_groups: list[ScheduledPricingGroup],
    reservation_ends_at: datetime.datetime | None,
    reservations_max_days_before: int | None,
) -> PriceChange | None:
    """
    Find the first date after today on which the price summary of the reservation unit differs from today's.

    Only changes on dates on which a customer can still make a reservation are included.

    :param pricing_groups: The pricing group in use today and the pricing groups that begin later.
                           Each with its base and surcharge components that are valid today or later.
    :param reservation_ends_at: No reservation can begin at or after this moment.
    :param reservations_max_days_before: How many days ahead a reservation can begin.
    """
    today = local_date()
    today_summary = _summarize_on_date(pricing_groups=pricing_groups, on_date=today)

    change_dates: set[datetime.date] = set()
    for pricing_group in pricing_groups:
        change_dates.add(pricing_group.begins)
        for scheduled_price in pricing_group.base_prices:
            change_dates.add(scheduled_price.valid_from)
            if scheduled_price.valid_until is not None:
                change_dates.add(scheduled_price.valid_until)
        for surcharge in pricing_group.surcharges:
            change_dates.add(surcharge.valid_from)
            if surcharge.valid_until is not None:
                change_dates.add(surcharge.valid_until)

    latest_reservation_start: datetime.datetime | None = None
    if reservations_max_days_before:
        now = local_datetime()
        latest_reservation_start = local_add_days(now, days=reservations_max_days_before)

    for change_date in sorted(change_dates):
        if change_date <= today:
            continue

        start_of_change_date = local_start_of_day(change_date)
        if reservation_ends_at is not None and start_of_change_date >= reservation_ends_at:
            break
        if latest_reservation_start is not None and start_of_change_date > latest_reservation_start:
            break

        summary = _summarize_on_date(pricing_groups=pricing_groups, on_date=change_date)
        if summary is None or summary == today_summary:
            continue

        return PriceChange(begins=change_date, summary=summary)

    return None


# Internals


def _summarize_on_date(*, pricing_groups: list[ScheduledPricingGroup], on_date: datetime.date) -> PriceSummary | None:
    pricing_group = _pricing_group_on_date(pricing_groups=pricing_groups, on_date=on_date)
    if pricing_group is None:
        return None

    base_prices = [
        scheduled_price.base_price
        for scheduled_price in pricing_group.base_prices
        if scheduled_price.valid_from <= on_date
        and (scheduled_price.valid_until is None or scheduled_price.valid_until > on_date)
    ]
    surcharge_amounts = [
        surcharge.amount
        for surcharge in pricing_group.surcharges
        if surcharge.valid_from <= on_date and (surcharge.valid_until is None or surcharge.valid_until > on_date)
    ]
    return summarize_prices(base_prices=base_prices, surcharge_amounts=surcharge_amounts)


def _pricing_group_on_date(
    *,
    pricing_groups: list[ScheduledPricingGroup],
    on_date: datetime.date,
) -> ScheduledPricingGroup | None:
    begun_groups = [pricing_group for pricing_group in pricing_groups if pricing_group.begins <= on_date]
    if not begun_groups:
        return None

    return max(begun_groups, key=lambda group: group.begins)
