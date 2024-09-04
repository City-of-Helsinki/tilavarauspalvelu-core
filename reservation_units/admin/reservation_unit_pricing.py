from django.contrib import admin
from rangefilter.filters import DateRangeFilterBuilder

from reservation_units.models import ReservationUnitPricing
from utils.decimal_utils import round_decimal

__all__ = [
    "ReservationUnitPricingAdmin",
]


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "id",
        "reservation_unit",
        "begins",
        "is_activated_on_begins",
        "lowest_price",
        "highest_price",
        "tax_percentage",
        "price_unit",
    ]
    list_filter = [
        ("begins", DateRangeFilterBuilder()),
        "is_activated_on_begins",
    ]
    ordering = ["-begins"]

    # Form
    fields = [
        "reservation_unit",
        "begins",
        "is_activated_on_begins",
        ("lowest_price", "lowest_price_net"),
        ("highest_price", "highest_price_net"),
        "tax_percentage",
        "status",
        "price_unit",
    ]
    readonly_fields = [
        "lowest_price_net",
        "highest_price_net",
    ]

    def lowest_price_net(self, obj: ReservationUnitPricing) -> str:
        return f"{round_decimal(obj.lowest_price_net, 2)} €"

    def highest_price_net(self, obj: ReservationUnitPricing) -> str:
        return f"{round_decimal(obj.highest_price_net, 2)} €"
