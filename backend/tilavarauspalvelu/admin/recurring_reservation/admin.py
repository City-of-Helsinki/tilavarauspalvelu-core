from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.contrib.admin import EmptyFieldListFilter
from lookup_property import L

from tilavarauspalvelu.admin.reservation.admin import ReservationInline
from tilavarauspalvelu.models import RecurringReservation

from .filters import ShouldHaveActiveAccessCodeFilter

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "RecurringReservationAdmin",
]


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    # List
    fields = [
        "ext_uuid",
        "name",
        "reservation_unit",
        "allocated_time_slot",
        "begin_date",
        "end_date",
        "recurrence_in_days",
        "should_have_active_access_code",
    ]
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
    readonly_fields = [
        "ext_uuid",
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
            )
            .annotate(
                should_have_active_access_code=L("should_have_active_access_code"),
            )
        )
