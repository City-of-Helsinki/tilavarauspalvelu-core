from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.admin.tax_level.form import TaxLevelRateFormSet
from tilavarauspalvelu.models import TaxLevel, TaxLevelRate

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class TaxLevelRateInline(admin.TabularInline):
    model = TaxLevelRate
    fields = [
        "begins",
        "percentage",
    ]
    ordering = ["-begins"]
    formset = TaxLevelRateFormSet
    extra = 0


@admin.register(TaxLevel)
class TaxLevelAdmin(TVPAuditlogHistoryAdminMixin, TranslationAdmin):
    # List
    list_display = [
        "name",
        "current_percentage",
    ]

    # Form
    fields = [
        "name",
    ]
    inlines = [TaxLevelRateInline]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(current_percentage=L("current_percentage"))

    @admin.display(description=_("current percentage"))
    def current_percentage(self, obj: TaxLevel) -> str:
        percentage = obj.current_percentage
        if percentage is None:
            return "-"
        return f"{percentage}%"
