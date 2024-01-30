from decimal import Decimal

from django.contrib import admin

from reservation_units.models import ReservationUnitPricing


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(admin.ModelAdmin):
    model = ReservationUnitPricing

    fields = (
        "reservation_unit",
        "begins",
        "lowest_price",
        "lowest_price_net",
        "highest_price",
        "highest_price_net",
        "tax_percentage",
        "status",
        "pricing_type",
        "price_unit",
    )
    readonly_fields = [
        "lowest_price_net",
        "highest_price_net",
    ]

    def lowest_price_net(self, obj: ReservationUnitPricing) -> Decimal:
        return obj.lowest_price_net

    def highest_price_net(self, obj: ReservationUnitPricing) -> Decimal:
        return obj.highest_price_net
