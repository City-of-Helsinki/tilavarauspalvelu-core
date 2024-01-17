from datetime import date, datetime
from decimal import Decimal
from typing import Any

from graphql import GraphQLError

from reservation_units.enums import PricingStatus
from reservation_units.models import ReservationUnit, ReservationUnitPricing
from utils.decimal_utils import round_decimal


class ReservationUnitPricingHelper:
    @classmethod
    def get_active_price(cls, reservation_unit: ReservationUnit) -> ReservationUnitPricing | None:
        return reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()

    @classmethod
    def get_future_price(cls, reservation_unit: ReservationUnit) -> ReservationUnitPricing | None:
        return reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()

    @classmethod
    def get_price_by_date(
        cls, reservation_unit: ReservationUnit, by_date: datetime.date
    ) -> ReservationUnitPricing | None:
        future_price = cls.get_future_price(reservation_unit)
        if future_price and future_price.begins <= by_date:
            return future_price

        return cls.get_active_price(reservation_unit)

    @classmethod
    def is_active(cls, pricing: dict[str, Any]) -> bool:
        return pricing.get("status") == PricingStatus.PRICING_STATUS_ACTIVE

    @classmethod
    def is_future(cls, pricing: dict[str, Any]) -> bool:
        return pricing.get("status") == PricingStatus.PRICING_STATUS_FUTURE

    @classmethod
    def check_pricing_required(cls, is_draft: bool, data: dict[str, Any]):
        pricings = data.get("pricings", [])

        if not is_draft and not pricings:
            raise GraphQLError("pricings is required and must have one ACTIVE and one optional FUTURE pricing")

    @classmethod
    def check_pricing_dates(cls, data: dict[str, Any]):
        pricings = data.get("pricings", [])
        for pricing in pricings:
            if cls.is_active(pricing):
                if pricing.get("begins") > date.today():
                    raise GraphQLError("ACTIVE pricing must be in the past or today")
            elif ReservationUnitPricingHelper.is_future(pricing) and pricing.get("begins") <= date.today():
                raise GraphQLError("FUTURE pricing must be in the future")

    @classmethod
    def check_pricing_counts(cls, is_draft: bool, data: dict[str, Any]):
        pricings = data.get("pricings", [])

        active_count = 0
        future_count = 0
        other_count = 0

        for pricing in pricings:
            if ReservationUnitPricingHelper.is_active(pricing):
                active_count += 1
            elif ReservationUnitPricingHelper.is_future(pricing):
                future_count += 1
            else:
                other_count += 1

        if (not is_draft and active_count != 1) or (is_draft and active_count > 1):
            raise GraphQLError("reservation unit must have exactly one ACTIVE pricing")
        if future_count > 1:
            raise GraphQLError("reservation unit can have only one FUTURE pricing")
        if other_count > 0:
            raise GraphQLError("only ACTIVE and FUTURE pricings can be mutated")

    @classmethod
    def calculate_vat_prices(cls, data: dict[str, Any]) -> dict[str, Any]:
        """Calculates vat prices from net prices and returns a dict of pricing data."""
        pricings = data.get("pricings", [])

        for pricing in pricings:
            highest_price_net = pricing.get("highest_price_net", 0)
            lowest_price_net = pricing.get("lowest_price_net", 0)

            if highest_price_net < lowest_price_net:
                raise GraphQLError("Highest price cannot be less than lowest price.")

            tax_percentage = pricing.get("tax_percentage")

            if not tax_percentage or tax_percentage.value == 0:
                pricing["highest_price"] = highest_price_net
                pricing["lowest_price"] = lowest_price_net
            else:
                pricing["highest_price"] = round_decimal(Decimal(highest_price_net * (1 + tax_percentage.decimal)), 2)
                pricing["lowest_price"] = round_decimal(Decimal(lowest_price_net * (1 + tax_percentage.decimal)), 2)

        return pricings

    @classmethod
    def contains_status(cls, status: PricingStatus, pricings: list[dict[Any, Any]]) -> bool:
        return any(pricing.get("status", "") == status for pricing in pricings)
