from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from more_admin_filters.filters import MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "AccessCodeGeneratedFilter",
    "PaidReservationListFilter",
    "ReservationSeriesListFilter",
    "ReservationUnitFilter",
    "UnitFilter",
]


class ReservationSeriesListFilter(admin.SimpleListFilter):
    title = _("reservation series")
    parameter_name = "reservation_series"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]) -> QuerySet[Reservation]:
        if self.value() == "1":
            return queryset.filter(reservation_series__isnull=False)
        if self.value() == "0":
            return queryset.filter(reservation_series__isnull=True)
        return queryset


class PaidReservationListFilter(admin.SimpleListFilter):
    title = _("Paid reservation")
    parameter_name = "paid_reservation"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]) -> QuerySet[Reservation]:
        if self.value() == "1":
            return queryset.filter(price__gt=0)
        if self.value() == "0":
            return queryset.filter(price=0)
        return queryset


class UnitFilter(MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter):
    def field_admin_ordering(self, *args: Any, **kwargs: Any) -> list[str]:
        return ["name"]


class ReservationUnitFilter(MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter):
    def field_admin_ordering(self, *args: Any, **kwargs: Any) -> list[str]:
        return ["unit__name", "name"]


class AccessCodeGeneratedFilter(admin.SimpleListFilter):
    title = _("access code generated")
    parameter_name = "access_code_generated"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]) -> QuerySet[Reservation]:
        if self.value() == "1":
            return queryset.filter(access_code_generated_at__isnull=False)
        if self.value() == "0":
            return queryset.filter(access_code_generated_at__isnull=True)
        return queryset
