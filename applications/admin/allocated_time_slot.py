from django.contrib import admin

from applications.models import AllocatedTimeSlot

from .forms.allocated_time_slot import AllocatedTimeSlotAdminForm

__all__ = [
    "AllocatedTimeSlotAdmin",
]


@admin.register(AllocatedTimeSlot)
class AllocatedTimeSlotAdmin(admin.ModelAdmin):
    form = AllocatedTimeSlotAdminForm
    list_filter = [
        "day_of_the_week",
    ]
    search_fields = [
        "day_of_the_week",
        "reservation_unit_option__reservation_unit__name",
        "reservation_unit_option__reservation_unit__unit__name",
        "reservation_unit_option__application_section__name",
        "reservation_unit_option__application_section__application__user__first_name",
        "reservation_unit_option__application_section__application__user__last_name",
        "reservation_unit_option__application_section__application__user__email",
    ]
