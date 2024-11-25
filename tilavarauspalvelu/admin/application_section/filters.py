from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.db import models
from django.db.models.functions import Concat
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.enums import (
    ApplicationRoundStatusChoice,
    ApplicationSectionStatusChoice,
    ApplicationStatusChoice,
)
from tilavarauspalvelu.models import AgeGroup, ReservationPurpose

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class ApplicationRoundStatusFilter(admin.SimpleListFilter):
    title = _("Application round status")
    parameter_name = "round_status"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationRoundStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(application__application_round__status=value))


class ApplicationStatusFilter(admin.SimpleListFilter):
    title = _("Application status")
    parameter_name = "application_status"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(application__status=value))


class ApplicationSectionStatusFilter(admin.SimpleListFilter):
    title = _("Application section status")
    parameter_name = "section_status"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ApplicationSectionStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(status=value))


class AgeGroupFilter(admin.SimpleListFilter):
    title = _("Age group")
    parameter_name = "age_group"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return AgeGroup.objects.annotate(
            repr=models.Case(
                models.When(maximum=None, then=Concat("minimum", models.Value("+"), output_field=models.CharField())),
                default=Concat("minimum", models.Value(" - "), "maximum", output_field=models.CharField()),
                output_field=models.CharField(),
            ),
        ).values_list("id", "repr")

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(age_group=value)


class ReservationPurposeFilter(admin.SimpleListFilter):
    title = _("Reservation purpose")
    parameter_name = "purpose"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return ReservationPurpose.objects.values_list("id", "name")

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(purpose=value)
