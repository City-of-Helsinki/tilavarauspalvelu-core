from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.db.models import Exists, OuterRef
from django.utils.translation import gettext_lazy as _
from more_admin_filters.filters import MultiSelectFilter, MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter

from tilavarauspalvelu.models import Reservation, ReservationUnit, Unit

if TYPE_CHECKING:
    from django.db.models import Field, QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "AccessCodeGeneratedFilter",
    "ChoicesMultiSelectFilter",
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


class ChoicesMultiSelectFilter(MultiSelectFilter):
    def __init__(
        self,
        field: Field,
        request: WSGIRequest,
        params: dict[str, Any],
        model: type[Reservation],
        model_admin: admin.ModelAdmin,
        field_path: str,
    ) -> None:
        super().__init__(field, request, params, model, model_admin, field_path)
        # Take the options from the field choices. Selecting the distinct values reads the whole table.
        self.lookup_choices = sorted(value for value, _label in field.flatchoices)


class UnitFilter(MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter):
    def field_choices(
        self,
        field: Any,  # noqa: ARG002
        request: WSGIRequest,
        model_admin: admin.ModelAdmin,  # noqa: ARG002
    ) -> list[tuple[int, str]]:
        # Check each unit with the index on 'reservation_unit_id'.
        # Selecting the distinct units from the reservations reads the whole table.
        reservations = Reservation.objects.filter(reservation_unit__unit=OuterRef("pk"))
        units = Unit.objects.filter(Exists(reservations)).order_by("name")
        return [(unit.pk, str(unit)) for unit in units]


class ReservationUnitFilter(MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter):
    def field_choices(
        self,
        field: Any,  # noqa: ARG002
        request: WSGIRequest,
        model_admin: admin.ModelAdmin,  # noqa: ARG002
    ) -> list[tuple[int, str]]:
        # Check each reservation unit with the index on 'reservation_unit_id'.
        # Selecting the distinct reservation units from the reservations reads the whole table.
        # The option label includes the unit name, so fetch the units in the same query.
        reservations = Reservation.objects.filter(reservation_unit=OuterRef("pk"))
        reservation_units = (
            ReservationUnit.objects.filter(Exists(reservations)).select_related("unit").order_by("unit__name", "name")
        )
        return [(reservation_unit.pk, str(reservation_unit)) for reservation_unit in reservation_units]


class AccessCodeGeneratedFilter(admin.SimpleListFilter):
    title = _("door code generated")
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
