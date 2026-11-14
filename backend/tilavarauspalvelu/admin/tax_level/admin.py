from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.db import models
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.admin.tax_level.form import TaxLevelRateForm, TaxLevelRateFormSet
from tilavarauspalvelu.models import TaxLevel, TaxLevelRate
from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "TaxLevelAdmin",
]


class TaxLevelRateInline(admin.TabularInline):
    model = TaxLevelRate
    form = TaxLevelRateForm
    formset = TaxLevelRateFormSet
    ordering = ["-begins"]

    def get_extra(self, request: WSGIRequest, obj: TaxLevel | None = None, **kwargs: Any) -> int:
        # A new tax level needs a rate in effect today.
        if obj is None:
            return 1
        return 0


@admin.register(TaxLevel)
class TaxLevelAdmin(TVPAuditlogHistoryAdminMixin, TranslationAdmin):
    # List
    list_display = [
        "name",
        "current_percentage",
        "next_percentage",
        "next_percentage_begins",
    ]

    # Form
    fields = [
        "name",
    ]
    inlines = [TaxLevelRateInline]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        next_rates = TaxLevelRate.objects.filter(tax_level=models.OuterRef("pk"), begins__gt=local_date()).order_by(
            "begins"
        )
        return (
            super()
            .get_queryset(request)
            .annotate(
                current_percentage=L("current_percentage"),
                next_percentage=models.Subquery(next_rates.values("percentage")[:1]),
                next_percentage_begins=models.Subquery(next_rates.values("begins")[:1]),
            )
        )

    @admin.display(description=_("current percentage"))
    def current_percentage(self, obj: TaxLevel) -> str:
        percentage = obj.current_percentage
        if percentage is None:
            return "-"
        return f"{percentage}%"

    @admin.display(description=_("next percentage"))
    def next_percentage(self, obj: TaxLevel) -> str:
        percentage = obj.next_percentage  # type: ignore[attr-defined]
        if percentage is None:
            return "-"
        return f"{percentage}%"

    @admin.display(description=_("next percentage begins"), empty_value="-")
    def next_percentage_begins(self, obj: TaxLevel) -> datetime.date | None:
        return obj.next_percentage_begins  # type: ignore[attr-defined]
