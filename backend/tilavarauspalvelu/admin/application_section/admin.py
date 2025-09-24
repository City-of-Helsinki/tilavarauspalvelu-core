from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.admin.application.form import ApplicationSectionInlineAdminForm
from tilavarauspalvelu.admin.application_section.filters import (
    AgeGroupFilter,
    ApplicationRoundStatusFilter,
    ApplicationSectionStatusFilter,
    ApplicationStatusFilter,
    ReservationPurposeFilter,
)
from tilavarauspalvelu.admin.application_section.form import (
    ApplicationSectionAdminForm,
    ReservationUnitOptionInlineAdminForm,
)
from tilavarauspalvelu.admin.suitable_time_range.admin import SuitableTimeRangeInline
from tilavarauspalvelu.models import ApplicationSection, ReservationUnitOption
from utils.utils import comma_sep_str

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class ApplicationSectionInline(admin.TabularInline):
    model = ApplicationSection
    form = ApplicationSectionInlineAdminForm
    extra = 0
    show_change_link = True
    can_delete = False

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(status=L("status")).prefetch_related("suitable_time_ranges")

    def has_add_permission(self, request: WSGIRequest, obj: ApplicationSection | None = None) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: ApplicationSection | None = None) -> bool:
        return False

    def suitable_days_of_the_week(self, obj: ApplicationSection) -> str:
        return comma_sep_str(item.label for item in obj.suitable_days_of_the_week)


class ReservationUnitOptionInline(admin.TabularInline):
    model = ReservationUnitOption
    form = ReservationUnitOptionInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).select_related("reservation_unit__unit")


@admin.register(ApplicationSection)
class ApplicationSectionAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "name",
        "application__user__first_name",
        "application__user__last_name",
        "ext_uuid",
    ]
    search_help_text = _("Search by name, application user's first name or last name, or external ID")

    # List
    list_display = [
        "id",
        "name",
        "application",
        "status",
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

    # Form
    form = ApplicationSectionAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "ext_uuid",
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
        "id",
        "ext_uuid",
        "should_have_active_access_code",
        "application",
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
                should_have_active_access_code=L("should_have_active_access_code"),
            )
            .select_related(
                "application",
                "application__user",
                "age_group",
                "purpose",
            )
        )

    @admin.display(ordering=L("status"))
    def status(self, obj: ApplicationSection) -> str:
        return obj.status

    @admin.display(ordering=L("application__status"))
    def application_status(self, obj: ApplicationSection) -> str:
        return obj.application_status
