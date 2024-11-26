from __future__ import annotations

from django.contrib import admin

from tilavarauspalvelu.admin.reservation.admin import ReservationInline
from tilavarauspalvelu.models import RecurringReservation


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "name",
        "reservation_unit",
        "allocated_time_slot",
        "begin_date",
        "end_date",
        "recurrence_in_days",
    ]

    # Form
    inlines = [ReservationInline]
