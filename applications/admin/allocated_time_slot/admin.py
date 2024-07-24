from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from applications.admin.allocated_time_slot.filters import (
    ApplicationRoundFilter,
    ApplicationRoundStatusFilter,
    ApplicationSectionStatusFilter,
    ApplicationStatusFilter,
    DayOfTheWeekFilter,
)
from applications.admin.allocated_time_slot.form import AllocatedTimeSlotAdminForm
from applications.models import AllocatedTimeSlot

__all__ = [
    "AllocatedTimeSlotAdmin",
]


@admin.register(AllocatedTimeSlot)
class AllocatedTimeSlotAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "day_of_the_week",
        "reservation_unit_option__reservation_unit__name",
        "reservation_unit_option__reservation_unit__unit__name",
        "reservation_unit_option__application_section__name",
        "reservation_unit_option__application_section__application__user__first_name",
        "reservation_unit_option__application_section__application__user__last_name",
        "reservation_unit_option__application_section__application__user__email",
    ]
    search_help_text = _(
        "Search by day of the week, reservation unit, unit, application section, user's first or last name or email"
    )

    # List
    list_display = [
        "id",
        "day_of_the_week",
        "begin_time",
        "end_time",
        "application",
    ]
    list_filter = [
        DayOfTheWeekFilter,
        ApplicationSectionStatusFilter,
        ApplicationStatusFilter,
        ApplicationRoundStatusFilter,
        ApplicationRoundFilter,
    ]
    ordering = ["-id"]

    # Form
    form = AllocatedTimeSlotAdminForm

    @admin.display(
        description=_("Application"),
        ordering="reservation_unit_option__application_section__application",
    )
    def application(self, obj: AllocatedTimeSlot) -> str:
        return str(obj.reservation_unit_option.application_section.application)

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(allocated_time_of_week=L("allocated_time_of_week"))
            .select_related(
                "reservation_unit_option__application_section__application__user",
                "reservation_unit_option__application_section__application__application_round",
            )
        )
