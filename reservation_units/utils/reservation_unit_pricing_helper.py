from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from rest_framework import serializers

from utils.decimal_utils import round_decimal

from ..models import PricingStatus, ReservationUnit, ReservationUnitPricing


class ReservationUnitPricingHelper:
    @classmethod
    def get_active_price(
        cls, reservation_unit: ReservationUnit
    ) -> Optional[ReservationUnitPricing]:
        return reservation_unit.pricings.filter(
            status=PricingStatus.PRICING_STATUS_ACTIVE
        ).first()

    @classmethod
    def get_future_price(
        cls, reservation_unit: ReservationUnit
    ) -> Optional[ReservationUnitPricing]:
        return reservation_unit.pricings.filter(
            status=PricingStatus.PRICING_STATUS_FUTURE
        ).first()

    @classmethod
    def get_price_by_date(
        cls, reservation_unit: ReservationUnit, date: datetime.date
    ) -> Optional[ReservationUnitPricing]:
        future_price = cls.get_future_price(reservation_unit)
        if future_price and future_price.begins <= date:
            return future_price

        return cls.get_active_price(reservation_unit)

    @classmethod
    def is_active(cls, pricing: Dict[str, Any]) -> bool:
        return pricing.get("status") == PricingStatus.PRICING_STATUS_ACTIVE

    @classmethod
    def is_future(cls, pricing: Dict[str, Any]) -> bool:
        return pricing.get("status") == PricingStatus.PRICING_STATUS_FUTURE

    @classmethod
    def check_pricing_required(cls, is_draft: bool, data: Dict[str, Any]):
        pricings = data.get("pricings", [])

        if not is_draft and not pricings:
            raise serializers.ValidationError(
                "pricings is required and must have one ACTIVE and one optional FUTURE pricing"
            )

    @classmethod
    def check_pricing_dates(cls, data: Dict[str, Any]):
        pricings = data.get("pricings", [])
        for pricing in pricings:
            if cls.is_active(pricing):
                if pricing.get("begins") > date.today():
                    raise serializers.ValidationError(
                        "ACTIVE pricing must be in the past or today"
                    )
            elif ReservationUnitPricingHelper.is_future(pricing):
                if pricing.get("begins") <= date.today():
                    raise serializers.ValidationError(
                        "FUTURE pricing must be in the future"
                    )

    @classmethod
    def check_pricing_counts(cls, is_draft: bool, data: Dict[str, Any]):
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
            raise serializers.ValidationError(
                "reservation unit must have exactly one ACTIVE pricing"
            )
        if future_count > 1:
            raise serializers.ValidationError(
                "reservation unit can have only one FUTURE pricing"
            )
        if other_count > 0:
            raise serializers.ValidationError(
                "only ACTIVE and FUTURE pricings can be mutated"
            )

    @classmethod
    def calculate_vat_prices(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates vat prices from net prices and returns a dict of pricing data."""
        pricings = data.get("pricings", [])

        for pricing in pricings:
            highest_price_net = pricing.get("highest_price_net", 0)
            lowest_price_net = pricing.get("lowest_price_net", 0)

            if highest_price_net < lowest_price_net:
                raise serializers.ValidationError(
                    "Highest price cannot be less than lowest price."
                )

            tax_percentage = pricing.get("tax_percentage")

            if not tax_percentage or tax_percentage.value == 0:
                pricing["highest_price"] = highest_price_net
                pricing["lowest_price"] = lowest_price_net
            else:
                pricing["highest_price"] = round_decimal(
                    Decimal(highest_price_net * (1 + tax_percentage.decimal)), 2
                )
                pricing["lowest_price"] = round_decimal(
                    Decimal(lowest_price_net * (1 + tax_percentage.decimal)), 2
                )

        return pricings

    @classmethod
    def contains_status(
        cls, status: PricingStatus, pricings: List[Dict[Any, Any]]
    ) -> bool:
        for pricing in pricings:
            if pricing.get("status", "") == status:
                return True

        return False
