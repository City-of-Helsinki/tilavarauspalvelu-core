from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import ReservationUnitOption

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "ReservationUnitOptionAdmin",
]


@admin.register(ReservationUnitOption)
class ReservationUnitOptionAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "reservation_unit__name",
        "reservation_unit__unit__name",
        "application_section__name",
        "application_section__application__user__first_name",
        "application_section__application__user__last_name",
        "application_section__application__user__email",
    ]
    search_help_text = "Search by reservation unit, unit, application section, user's first or last name or email"

    # List
    list_display = [
        "id",
        "application_section",
        "reservation_unit",
        "preferred_order",
    ]
    ordering = [
        "-id",
        "application_section",
        "preferred_order",
    ]

    # Form
    fields = [
        "application_section",
        "reservation_unit",
        "preferred_order",
        "is_rejected",
        "is_locked",
    ]
    readonly_fields = [
        "application_section",
        "reservation_unit",
    ]

    @admin.display(description=_("Application"), ordering="application_section__application")
    def application(self, obj: ReservationUnitOption) -> str:
        return str(obj.application_section.application)

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .select_related(
                "application_section__application__user",
                "application_section__application__application_round",
            )
        )
