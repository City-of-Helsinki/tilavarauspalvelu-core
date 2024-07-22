from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from applications.models import AllocatedTimeSlot

from .filters.allocated_time_slot import (
    ApplicationRoundFilter,
    ApplicationRoundStatusFilter,
    ApplicationSectionStatusFilter,
    ApplicationStatusFilter,
    DayOfTheWeekFilter,
)
from .forms.allocated_time_slot import AllocatedTimeSlotAdminForm

__all__ = [
    "AllocatedTimeSlotAdmin",
]


@admin.register(AllocatedTimeSlot)
class AllocatedTimeSlotAdmin(admin.ModelAdmin):
    form = AllocatedTimeSlotAdminForm
    list_display = [
        "slot",
        "application",
    ]
    list_filter = [
        DayOfTheWeekFilter,
        ApplicationSectionStatusFilter,
        ApplicationStatusFilter,
        ApplicationRoundStatusFilter,
        ApplicationRoundFilter,
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
    search_help_text = _(
        "Search by day of the week, reservation unit, unit, application section, user's first or last name or email"
    )

    @admin.display(description=_("Allocated Time Slot"), ordering="allocated_time_of_week")
    def slot(self, obj: AllocatedTimeSlot) -> str:
        return str(obj)

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
