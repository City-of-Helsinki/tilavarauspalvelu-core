from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.enums import PriceUnit

__all__ = [
    "BasePrice",
    "PriceSummary",
    "summarize_base_prices",
]


@dataclasses.dataclass(frozen=True, slots=True)
class BasePrice:
    amount: Decimal
    price_unit: PriceUnit


@dataclasses.dataclass(frozen=True, slots=True)
class PriceSummary:
    is_free: bool
    lowest_amount: Decimal
    price_unit: PriceUnit
    varies: bool


def summarize_base_prices(base_prices: list[BasePrice]) -> PriceSummary | None:
    """
    Summarize the base prices that a reservation unit has today, for search cards and lists.

    The lowest price is compared by amount only, even if the price units differ.
    Of equal amounts, the first one in the list gives the price unit.
    """
    if not base_prices:
        return None

    cheapest = min(base_prices, key=lambda base_price: base_price.amount)
    distinct_prices = set(base_prices)

    return PriceSummary(
        is_free=all(base_price.amount == 0 for base_price in base_prices),
        lowest_amount=cheapest.amount,
        price_unit=cheapest.price_unit,
        varies=len(distinct_prices) > 1,
    )
