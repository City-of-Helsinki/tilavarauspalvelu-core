from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.enums import PriceUnit

__all__ = [
    "BasePrice",
    "PriceSummary",
    "Surcharge",
    "summarize_prices",
]


@dataclasses.dataclass(frozen=True, slots=True)
class BasePrice:
    amount: Decimal
    price_unit: PriceUnit
    can_apply_for_discount: bool
    material_price_description_fi: str
    material_price_description_en: str
    material_price_description_sv: str
    tax_percentage: Decimal | None


@dataclasses.dataclass(frozen=True, slots=True)
class Surcharge:
    amount: Decimal
    can_apply_for_discount: bool


@dataclasses.dataclass(frozen=True, slots=True)
class PriceSummary:
    is_free: bool
    lowest_amount: Decimal
    price_unit: PriceUnit
    varies: bool
    can_apply_for_discount: bool
    material_price_description_fi: str
    material_price_description_en: str
    material_price_description_sv: str
    tax_percentage: Decimal | None


def summarize_prices(*, base_prices: list[BasePrice], surcharges: list[Surcharge]) -> PriceSummary | None:
    """
    Summarize the prices that a reservation unit has on one date, for search cards and lists.

    The lowest price is compared by amount only, even if the price units differ.
    Of equal amounts, the first one in the list gives the price unit and the tax percentage.
    The material price description comes from the cheapest base price that has one.
    A paid surcharge can be added to the base price, so the price varies and is not free.
    """
    if not base_prices:
        return None

    has_paid_surcharge = any(surcharge.amount > 0 for surcharge in surcharges)

    cheapest = min(base_prices, key=lambda base_price: base_price.amount)
    distinct_prices = {(base_price.amount, base_price.price_unit) for base_price in base_prices}
    prices_with_material_price = [
        base_price
        for base_price in base_prices
        if (
            base_price.material_price_description_fi
            or base_price.material_price_description_en
            or base_price.material_price_description_sv
        )
    ]
    material_price = min(prices_with_material_price, key=lambda base_price: base_price.amount, default=None)

    return PriceSummary(
        is_free=all(base_price.amount == 0 for base_price in base_prices) and not has_paid_surcharge,
        lowest_amount=cheapest.amount,
        price_unit=cheapest.price_unit,
        varies=len(distinct_prices) > 1 or has_paid_surcharge,
        can_apply_for_discount=(
            any(base_price.can_apply_for_discount for base_price in base_prices)
            or any(surcharge.can_apply_for_discount for surcharge in surcharges)
        ),
        material_price_description_fi=material_price.material_price_description_fi if material_price else "",
        material_price_description_en=material_price.material_price_description_en if material_price else "",
        material_price_description_sv=material_price.material_price_description_sv if material_price else "",
        tax_percentage=cheapest.tax_percentage,
    )
