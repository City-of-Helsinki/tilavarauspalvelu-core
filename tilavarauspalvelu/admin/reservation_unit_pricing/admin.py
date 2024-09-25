from django.contrib import admin
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.models import ReservationUnitPricing
from utils.decimal_utils import round_decimal


class ReservationUnitPricingInline(admin.TabularInline):
    model = ReservationUnitPricing
    show_change_link = True
    extra = 0


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "id",
        "reservation_unit",
        "begins",
        "lowest_price",
        "highest_price",
        "tax_percentage",
        "price_unit",
        "status",
    ]
    list_filter = [
        ("begins", DateRangeFilterBuilder()),
        "status",
        "pricing_type",
        "tax_percentage",
    ]
    ordering = ["-begins"]

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
