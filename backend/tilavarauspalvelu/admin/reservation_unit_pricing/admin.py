from __future__ import annotations

from typing import Any

from django.contrib import admin
from more_admin_filters.filters import MultiSelectRelatedOnlyDropdownFilter
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.models import ReservationUnitPricing
from utils.decimal_utils import round_decimal


class ReservationUnitFilter(MultiSelectRelatedOnlyDropdownFilter):
    def field_admin_ordering(self, *args: Any, **kwargs: Any) -> list[str]:
        return ["unit__name", "name"]


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
        "is_activated_on_begins",
    ]
    list_filter = [
        ("begins", DateRangeFilterBuilder()),
        "tax_percentage",
        "is_activated_on_begins",
        ("reservation_unit", ReservationUnitFilter),
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
