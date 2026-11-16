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
    can_apply_for_discount: bool


@dataclasses.dataclass(frozen=True, slots=True)
class PriceSummary:
    is_free: bool
    lowest_amount: Decimal
    price_unit: PriceUnit
    varies: bool
    can_apply_for_discount: bool


def summarize_base_prices(base_prices: list[BasePrice]) -> PriceSummary | None:
    """
    Summarize the base prices that a reservation unit has today, for search cards and lists.

    The lowest price is compared by amount only, even if the price units differ.
    Of equal amounts, the first one in the list gives the price unit.
    """
    if not base_prices:
        return None

    cheapest = min(base_prices, key=lambda base_price: base_price.amount)
    distinct_prices = {(base_price.amount, base_price.price_unit) for base_price in base_prices}

    return PriceSummary(
        is_free=all(base_price.amount == 0 for base_price in base_prices),
        lowest_amount=cheapest.amount,
        price_unit=cheapest.price_unit,
        varies=len(distinct_prices) > 1,
        can_apply_for_discount=any(base_price.can_apply_for_discount for base_price in base_prices),
    )
