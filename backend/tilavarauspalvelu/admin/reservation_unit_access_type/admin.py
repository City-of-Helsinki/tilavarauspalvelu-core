from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from more_admin_filters.filters import MultiSelectRelatedOnlyDropdownFilter
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitAccessType

if TYPE_CHECKING:
    from django.db.models import QuerySet

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


@admin.register(ReservationUnitAccessType)
class ReservationUnitAccessTypeAdmin(TVPAuditlogHistoryAdminMixin, admin.ModelAdmin):
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
        return super().get_queryset(request).annotate(end_date=L("end_date")).select_related("reservation_unit__unit")
