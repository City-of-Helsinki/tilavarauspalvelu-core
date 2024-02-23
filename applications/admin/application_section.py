from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from lookup_property import L

from applications.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange

from .filters.application_section import (
    AgeGroupFilter,
    ApplicationRoundStatusFilter,
    ApplicationSectionStatusFilter,
    ApplicationStatusFilter,
    ReservationPurposeFilter,
)
from .forms.application_section import ApplicationSectionAdminForm
from .forms.reservation_unit_option import ReservationUnitOptionInlineAdminForm
from .forms.suitable_time_range import SuitableTimeRangeInlineAdminForm

__all__ = [
    "ApplicationSectionAdmin",
]


class ReservationUnitOptionInline(admin.StackedInline):
    model = ReservationUnitOption
    form = ReservationUnitOptionInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).select_related("reservation_unit__unit")


class SuitableTimeRangeInline(admin.StackedInline):
    model = SuitableTimeRange
    form = SuitableTimeRangeInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(fulfilled=L("fulfilled"))


@admin.register(ApplicationSection)
class ApplicationSectionAdmin(admin.ModelAdmin):
    form = ApplicationSectionAdminForm
    list_display = [
        "name",
        "application",
    ]
    list_filter = [
        ApplicationSectionStatusFilter,
        ApplicationStatusFilter,
        ApplicationRoundStatusFilter,
        AgeGroupFilter,
        ReservationPurposeFilter,
    ]
    search_fields = [
        "name",
        "application__user__first_name",
        "application__user__last_name",
    ]
    inlines = [
        SuitableTimeRangeInline,
        ReservationUnitOptionInline,
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(status=L("status"))
            .select_related(
                "application",
                "application__user",
                "age_group",
                "purpose",
            )
        )
