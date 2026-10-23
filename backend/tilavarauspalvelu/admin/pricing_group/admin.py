from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TabbedTranslationAdmin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.models import PricingGroup

from .form import PriceComponentInline, ReservationUnitPricingGroupInline

__all__ = [
    "PricingGroupAdmin",
]


@admin.register(PricingGroup)
class PricingGroupAdmin(TVPAuditlogHistoryAdminMixin, TabbedTranslationAdmin):
    # Functions
    search_fields = ["name"]
    search_help_text = _("Search by name")

    # List
    list_display = [
        "id",
        "name",
        "unit_group",
    ]
    list_filter = ["unit_group"]
    list_select_related = ["unit_group"]
    ordering = ["name"]

    # Form
    fields = [
        "name",
        "unit_group",
    ]
    inlines = [
        PriceComponentInline,
        ReservationUnitPricingGroupInline,
    ]
