from __future__ import annotations

from django.contrib import admin
from django.contrib.admin import EmptyFieldListFilter

from tilavarauspalvelu.admin.reservation.admin import ReservationInline
from tilavarauspalvelu.models import RecurringReservation


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "ext_uuid",
        "name",
        "reservation_unit",
        "allocated_time_slot",
        "begin_date",
        "end_date",
        "recurrence_in_days",
    ]
    list_filter = [("allocated_time_slot", EmptyFieldListFilter)]

    # Form
    readonly_fields = [
        "ext_uuid",
    ]
    inlines = [ReservationInline]
