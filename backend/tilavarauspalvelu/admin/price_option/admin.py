from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TabbedTranslationAdmin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.models import PriceOption

from .form import PriceOptionAdminForm

__all__ = [
    "PriceOptionAdmin",
]


@admin.register(PriceOption)
class PriceOptionAdmin(TVPAuditlogHistoryAdminMixin, TabbedTranslationAdmin):
    # Functions
    search_fields = ["name"]
    search_help_text = _("Search by name")

    # List
    list_display = [
        "id",
        "name",
        "unit_group",
        "is_active",
    ]
    list_filter = ["unit_group", "is_active"]
    list_select_related = ["unit_group"]
    ordering = ["name"]

    # Form
    form = PriceOptionAdminForm
    fields = [
        "name",
        "description",
        "unit_group",
        "is_active",
    ]
