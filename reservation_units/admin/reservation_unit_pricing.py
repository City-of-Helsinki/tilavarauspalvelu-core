from django.contrib import admin

from reservation_units.models import ReservationUnitPricing
from utils.decimal_utils import round_decimal

__all__ = [
    "ReservationUnitPricingAdmin",
]


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "reservation_unit",
        "begins",
        "lowest_price",
        "highest_price",
        "tax_percentage",
        "price_unit",
        "status",
    ]

    # Form
    fields = [
        "reservation_unit",
        "begins",
        ("lowest_price", "lowest_price_net"),
        ("highest_price", "highest_price_net"),
        "tax_percentage",
        "status",
        "pricing_type",
        "price_unit",
    ]
    readonly_fields = [
        "lowest_price_net",
        "highest_price_net",
    ]

    def lowest_price_net(self, obj: ReservationUnitPricing) -> str:
        return f"{round_decimal(obj.lowest_price_net, 4)} €"

    def highest_price_net(self, obj: ReservationUnitPricing) -> str:
        return f"{round_decimal(obj.highest_price_net, 4)} €"
