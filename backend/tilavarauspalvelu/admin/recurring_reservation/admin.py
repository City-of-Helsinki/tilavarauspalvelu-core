from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.contrib.admin import EmptyFieldListFilter
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.admin.reservation.admin import ReservationInline
from tilavarauspalvelu.models import RecurringReservation

from .filters import ShouldHaveActiveAccessCodeFilter
from .form import ReservationSeriesAdminForm

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "RecurringReservationAdmin",
]


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
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
                    "created",
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
                    "pindora_response",
                ],
            },
        ],
    ]
    readonly_fields = [
        "ext_uuid",
        "created",
        "should_have_active_access_code",
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
            )
        )
