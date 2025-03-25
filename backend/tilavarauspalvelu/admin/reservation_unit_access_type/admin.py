from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from more_admin_filters.filters import MultiSelectRelatedOnlyDropdownFilter
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.models import ReservationUnitAccessType

if TYPE_CHECKING:
    from django.db.models import QuerySet


class ReservationUnitFilter(MultiSelectRelatedOnlyDropdownFilter):
    def field_admin_ordering(self, *args: Any, **kwargs: Any) -> list[str]:
        return ["unit__name", "name"]


@admin.register(ReservationUnitAccessType)
class ReservationUnitAccessTypeAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "id",
        "access_type",
        "begin_date",
        "reservation_unit",
    ]
    list_filter = [
        ("begin_date", DateRangeFilterBuilder(title=_("Begin date"))),
        ("reservation_unit", ReservationUnitFilter),
    ]
    ordering = ["-begin_date"]

    # Form
    fields = [
        "access_type",
        "begin_date",
        "end_date",
        "reservation_unit",
    ]
    readonly_fields = [
        "access_type",
        "begin_date",
        "end_date",
        "reservation_unit",
    ]

    def get_queryset(self, request: Any) -> QuerySet:
        return super().get_queryset(request).annotate(end_date=L("end_date")).select_related("reservation_unit")
