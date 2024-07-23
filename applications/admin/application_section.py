from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
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


class ReservationUnitOptionInline(admin.TabularInline):
    model = ReservationUnitOption
    form = ReservationUnitOptionInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).select_related("reservation_unit__unit")


class SuitableTimeRangeInline(admin.TabularInline):
    model = SuitableTimeRange
    form = SuitableTimeRangeInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(fulfilled=L("fulfilled"))


@admin.register(ApplicationSection)
class ApplicationSectionAdmin(admin.ModelAdmin):
    form = ApplicationSectionAdminForm

    list_display = [
        "id",
        "name",
        "application",
        "_status",
        "application_status",
    ]
    list_filter = [
        ApplicationSectionStatusFilter,
        ApplicationStatusFilter,
        ApplicationRoundStatusFilter,
        AgeGroupFilter,
        ReservationPurposeFilter,
    ]
    ordering = ["-id"]

    search_fields = [
        "name",
        "application__user__first_name",
        "application__user__last_name",
    ]
    search_help_text = _("Search by name, application user's first name or last name")

    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "name",
                    "status",
                    "application",
                    "num_persons",
                    "age_group",
                    "purpose",
                ],
            },
        ],
        [
            _("Time"),
            {
                "fields": [
                    "reservation_min_duration",
                    "reservation_max_duration",
                    "reservations_begin_date",
                    "reservations_end_date",
                    "applied_reservations_per_week",
                ],
            },
        ],
    ]
    readonly_fields = [
        "id",
    ]
    inlines = [
        SuitableTimeRangeInline,
        ReservationUnitOptionInline,
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(
                status=L("status"),
                application_status=L("application__status"),
            )
            .select_related(
                "application",
                "application__user",
                "age_group",
                "purpose",
            )
        )

    @admin.display()
    def application_status(self, obj) -> str:
        return obj.application_status
