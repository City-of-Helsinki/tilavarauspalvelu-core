from datetime import date


def update_reservation_unit_pricings(today: date) -> int:
    from .models import PricingStatus, ReservationUnitPricing

    future_pricings = ReservationUnitPricing.objects.filter(
        status=PricingStatus.PRICING_STATUS_FUTURE, begins=today
    )
    num_updated = 0
    for future_pricing in future_pricings:
        active_pricing = future_pricing.reservation_unit.pricings.filter(
            status=PricingStatus.PRICING_STATUS_ACTIVE
        ).first()

        if active_pricing is not None:
            active_pricing.status = PricingStatus.PRICING_STATUS_PAST
            active_pricing.save()

        future_pricing.status = PricingStatus.PRICING_STATUS_ACTIVE
        future_pricing.save()

        num_updated += 1
    return num_updated
