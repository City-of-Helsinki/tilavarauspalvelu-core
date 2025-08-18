from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.contrib.admin import EmptyFieldListFilter
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.models import ReservationSeries

from .filters import ShouldHaveActiveAccessCodeFilter
from .form import ReservationInline, ReservationSeriesAdminForm

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "ReservationSeriesAdmin",
]


@admin.register(ReservationSeries)
class ReservationSeriesAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "name",
        "user__first_name",
        "user__last_name",
        "description",
        "ext_uuid",
        "reservation_unit__name",
        "reservation_unit__ext_uuid",
        "allocated_time_slot__reservation_unit_option__application_section__ext_uuid",
    ]
    search_help_text = _(
        "Search by name, user's first name or last name, description, external ID, "
        "reservation unit name or external ID or application section external ID"
    )

    # List
    list_display = [
        "name",
        "reservation_unit",
        "begin_date",
        "end_date",
    ]
    list_filter = [
        ("allocated_time_slot", EmptyFieldListFilter),
        ShouldHaveActiveAccessCodeFilter,
    ]

    # Form
    form = ReservationSeriesAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "ext_uuid",
                    "name",
                    "description",
                    "created_at",
                    "reservation_unit",
                    "user",
                    "age_group",
                    "allocated_time_slot",
                ],
            },
        ],
        [
            _("Time"),
            {
                "fields": [
                    "begin_date",
                    "begin_time",
                    "end_date",
                    "end_time",
                    "weekdays",
                    "recurrence_in_days",
                ],
            },
        ],
        [
            _("Pindora information"),
            {
                "fields": [
                    "should_have_active_access_code",
                    "access_type",
                    "used_access_types",
                    "pindora_response",
                ],
            },
        ],
    ]
    readonly_fields = [
        "ext_uuid",
        "created_at",
        "should_have_active_access_code",
        "access_type",
        "used_access_types",
        "user",
        "allocated_time_slot",
        "reservation_unit",
    ]
    inlines = [ReservationInline]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .select_related(
                "reservation_unit",
                "allocated_time_slot",
                "user",
                "age_group",
            )
            .annotate(
                should_have_active_access_code=L("should_have_active_access_code"),
                access_type=L("access_type"),
                used_access_types=L("used_access_types"),
            )
        )
