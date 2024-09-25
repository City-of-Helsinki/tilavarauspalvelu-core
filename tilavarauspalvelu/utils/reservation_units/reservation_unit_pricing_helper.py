from datetime import date, datetime
from decimal import Decimal
from typing import Any

from graphql import GraphQLError

from tilavarauspalvelu.enums import PricingStatus
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitPricing
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
        active_price = cls.get_active_price(reservation_unit)
        future_price = cls.get_future_price(reservation_unit)

        if (
            future_price
            and future_price.begins <= by_date
            and (
                # Only return future price if it has begun and has the same tax percentage as the current active price.
                # When the future price has a different tax percentage, it should only be used for reservations which
                # are made after the ReservationUnitPricing.begins date. TILA-3470
                active_price.tax_percentage == future_price.tax_percentage
                # If either of the prices is free, the future price can be returned, as the percentage is irrelevant.
                or active_price.pricing_type != future_price.pricing_type
            )
        ):
            return future_price

        return active_price

    @classmethod
    def is_active(cls, pricing: dict[str, Any]) -> bool:
        return pricing.get("status") == PricingStatus.PRICING_STATUS_ACTIVE

    @classmethod
    def is_future(cls, pricing: dict[str, Any]) -> bool:
        return pricing.get("status") == PricingStatus.PRICING_STATUS_FUTURE

    @classmethod
    def check_pricing_required(cls, is_draft: bool, data: dict[str, Any]) -> None:
        pricings = data.get("pricings", [])

        if not is_draft and not pricings:
            raise GraphQLError("pricings is required and must have one ACTIVE and one optional FUTURE pricing")

    @classmethod
    def check_pricing_dates(cls, data: dict[str, Any]) -> None:
        pricings = data.get("pricings", [])
        for pricing in pricings:
            if cls.is_active(pricing):
                if pricing.get("begins") > date.today():
                    raise GraphQLError("ACTIVE pricing must be in the past or today")
            elif ReservationUnitPricingHelper.is_future(pricing) and pricing.get("begins") <= date.today():
                raise GraphQLError("FUTURE pricing must be in the future")

    @classmethod
    def check_pricing_counts(cls, is_draft: bool, data: dict[str, Any]) -> None:
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
    def calculate_vat_prices(cls, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Calculates vat prices from net prices and returns a dict of pricing data."""
        pricings: list[dict[str, Any]] = data.get("pricings", [])

        for pricing in pricings:
            highest_price = pricing.get("highest_price")
            lowest_price = pricing.get("lowest_price")

            # If both vat prices are given, skip calculating vat prices from net prices.
            if lowest_price is not None and highest_price is not None:
                continue

            highest_price_net = pricing.get("highest_price_net")
            lowest_price_net = pricing.get("lowest_price_net")

            if lowest_price_net or highest_price_net:
                if lowest_price_net is None or highest_price_net is None:
                    raise GraphQLError("Both lowest and highest price net must be given or neither.")
                if highest_price_net < lowest_price_net:
                    raise GraphQLError("Highest price cannot be less than lowest price.")

                tax_percentage = pricing.get("tax_percentage")

                if tax_percentage is None or tax_percentage.value == 0:
                    pricing["highest_price"] = highest_price_net
                    pricing["lowest_price"] = lowest_price_net
                else:
                    pricing["highest_price"] = round_decimal(Decimal(highest_price_net * tax_percentage.multiplier), 2)
                    pricing["lowest_price"] = round_decimal(Decimal(lowest_price_net * tax_percentage.multiplier), 2)

        return pricings

    @classmethod
    def contains_status(cls, status: PricingStatus, pricings: list[dict[Any, Any]]) -> bool:
        return any(pricing.get("status", "") == status for pricing in pricings)
