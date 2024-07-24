from django.contrib import admin

from reservations.models import RecurringReservation, Reservation

__all__ = [
    "RecurringReservationAdmin",
]


class ReservationInline(admin.TabularInline):
    model = Reservation
    extra = 0
    max_num = 0
    show_change_link = True
    can_delete = False
    fields = [
        "id",
        "name",
        "begin",
        "end",
        "state",
        "type",
        "price",
        "price_net",
        "unit_price",
    ]
    readonly_fields = fields


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
