from datetime import date


def update_reservation_unit_pricings(today: date) -> int:
    from reservation_units.enums import PricingStatus
    from reservation_units.models import ReservationUnitPricing

    future_pricings = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE, begins=today)
    for future_pricing in future_pricings:
        active_pricings = future_pricing.reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE)
        active_pricings.update(status=PricingStatus.PRICING_STATUS_PAST)

        future_pricing.status = PricingStatus.PRICING_STATUS_ACTIVE
        future_pricing.save()

    return len(future_pricings)
