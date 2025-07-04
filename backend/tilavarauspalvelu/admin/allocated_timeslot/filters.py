from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.enums import (
    ApplicationRoundStatusChoice,
    ApplicationSectionStatusChoice,
    ApplicationStatusChoice,
    Weekday,
)
from tilavarauspalvelu.models import ApplicationRound

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class ApplicationRoundFilter(admin.SimpleListFilter):
    title = _("Application Round")
    parameter_name = "application_round"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationRound.objects.filter(
            Q(sent_at__isnull=True) | Q(handled_at__isnull=True),
        ).values_list("id", "name")

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(reservation_unit_option__application_section__application__application_round_id=value)


class ApplicationRoundStatusFilter(admin.SimpleListFilter):
    title = _("Application round status")
    parameter_name = "round_status"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationRoundStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(
            L(reservation_unit_option__application_section__application__application_round__status=value)
        )


class ApplicationStatusFilter(admin.SimpleListFilter):
    title = _("Application status")
    parameter_name = "application_status"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(reservation_unit_option__application_section__application__status=value))


class ApplicationSectionStatusFilter(admin.SimpleListFilter):
    title = _("Application section status")
    parameter_name = "section_status"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationSectionStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(reservation_unit_option__application_section__status=value))


class DayOfTheWeekFilter(admin.SimpleListFilter):
    title = _("Day of the week")
    parameter_name = "day_of_the_week"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return Weekday.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(day_of_the_week=value)
