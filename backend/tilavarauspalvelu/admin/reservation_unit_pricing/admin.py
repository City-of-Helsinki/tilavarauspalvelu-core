from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from modeltranslation.admin import TabbedTranslationAdmin
from more_admin_filters.filters import MultiSelectRelatedOnlyDropdownFilter
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.admin.reservation_unit_pricing.form import ReservationUnitPricingAdminForm
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitPricing
from utils.decimal_utils import round_decimal

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


class ReservationUnitFilter(MultiSelectRelatedOnlyDropdownFilter):
    def field_choices(
        self,
        field: Any,  # noqa: ARG002
        request: WSGIRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[int, str]]:
        # The option label includes the unit name, so fetch the units in the same query.
        reservation_unit_ids = model_admin.get_queryset(request).values_list("reservation_unit", flat=True)
        reservation_units = (
            ReservationUnit.objects
            .filter(pk__in=reservation_unit_ids)
            .select_related("unit")
            .order_by("unit__name", "name")
        )
        return [(reservation_unit.pk, str(reservation_unit)) for reservation_unit in reservation_units]


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(TVPAuditlogHistoryAdminMixin, TabbedTranslationAdmin):
    # List
    list_display = [
        "id",
        "reservation_unit",
        "begins",
        "lowest_price",
        "highest_price",
        "tax_level",
        "price_unit",
    ]
    list_filter = [
        ("begins", DateRangeFilterBuilder()),
        "tax_level",
        ("reservation_unit", ReservationUnitFilter),
    ]
    list_select_related = ["reservation_unit__unit", "tax_level"]
    autocomplete_fields = ["reservation_unit"]
    ordering = ["-begins"]

    # Form
    form = ReservationUnitPricingAdminForm
    fields = [
        "reservation_unit",
        "begins",
        ("lowest_price", "lowest_price_net"),
        ("highest_price", "highest_price_net"),
        "price_unit",
        "payment_type",
        "tax_level",
        "material_price_description",
    ]
    readonly_fields = [
        "lowest_price_net",
        "highest_price_net",
    ]

    def lowest_price_net(self, obj: ReservationUnitPricing) -> str:
        return f"{round_decimal(obj.lowest_price_net, 2)} €"

    def highest_price_net(self, obj: ReservationUnitPricing) -> str:
        return f"{round_decimal(obj.highest_price_net, 2)} €"
