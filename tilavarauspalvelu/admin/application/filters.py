from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.db.models import Q, QuerySet
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import ApplicationRound

if TYPE_CHECKING:
    from tilavarauspalvelu.admin.application.admin import ApplicationAdmin
    from tilavarauspalvelu.typing import WSGIRequest


class ApplicationRoundFilter(admin.SimpleListFilter):
    title = _("Application Round")
    parameter_name = "application_round"

    def lookups(self, request: WSGIRequest, model_admin: ApplicationAdmin) -> list[tuple[str, str]]:
        return ApplicationRound.objects.filter(
            Q(sent_date__isnull=True) | Q(handled_date__isnull=True),
        ).values_list("id", "name")

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(application_round_id=value)


class ApplicationRoundStatusFilter(admin.SimpleListFilter):
    title = _("Application round status")
    parameter_name = "round_status"

    def lookups(self, request: WSGIRequest, model_admin: ApplicationAdmin) -> list[tuple[str, str]]:
        return ApplicationRoundStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(application_round__status=value))


class ApplicationStatusFilter(admin.SimpleListFilter):
    title = _("Application status")
    parameter_name = "application_status"

    def lookups(self, request: WSGIRequest, model_admin: ApplicationAdmin) -> list[tuple[str, str]]:
        return ApplicationStatusChoice.choices

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(L(status=value))
