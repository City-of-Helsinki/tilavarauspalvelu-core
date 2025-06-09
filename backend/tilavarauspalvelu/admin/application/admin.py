from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.admin.application.filters import (
    ApplicationRoundFilter,
    ApplicationRoundStatusFilter,
    ApplicationStatusFilter,
)
from tilavarauspalvelu.admin.application.form import ApplicationAdminForm
from tilavarauspalvelu.admin.application_section.admin import ApplicationSectionInline
from tilavarauspalvelu.models import Application

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet
    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    # Functions
    actions = ["reset_applications"]
    search_fields = [
        "user__first_name",
        "user__last_name",
        "organisation_name",
        "organisation_identifier",
        "organisation_street_address",
        "organisation_post_code__iexact",
        "organisation_city",
        "contact_person_first_name",
        "contact_person_last_name",
        "billing_street_address",
        "billing_post_code__iexact",
        "billing_city",
        "municipality",
    ]
    search_help_text = (
        "Search by one of these fields: "
        "user's first name, "
        "user's last name, "
        "organisation's name, "
        "organisation's identifier, "
        "organisation's street address, "
        "organisation's post code, "
        "organisation's city, "
        "contact person's first name, "
        "contact person's last name, "
        "billing address's street address, "
        "billing address's post code, "
        "billing address's city, "
        "or municipality"
    )

    # List
    list_display = [
        "id",
        "_name",
        "application_round",
        "created_at",
        "updated_at",
    ]
    list_filter = [
        ("created_at", DateRangeFilterBuilder(title=_("Created at"))),
        ApplicationStatusFilter,
        ApplicationRoundStatusFilter,
        ApplicationRoundFilter,
    ]
    ordering = ["-id"]

    # Form
    form = ApplicationAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "status",
                    "application_round",
                    "sent_at",
                    "cancelled_at",
                    "in_allocation_notification_sent_at",
                    "results_ready_notification_sent_at",
                ],
            },
        ],
        [
            _("Applicant"),
            {
                "fields": [
                    "user",
                    "applicant_type",
                ],
            },
        ],
        [
            _("Contact person"),
            {
                "fields": [
                    "contact_person_first_name",
                    "contact_person_last_name",
                    "contact_person_email",
                    "contact_person_phone_number",
                ],
            },
        ],
        [
            _("Organisation"),
            {
                "fields": [
                    "organisation_name",
                    "organisation_email",
                    "organisation_identifier",
                    "organisation_year_established",
                    "organisation_active_members",
                    "organisation_core_business",
                    "organisation_street_address",
                    "organisation_post_code",
                    "organisation_city",
                    "municipality",
                ],
            },
        ],
        [
            _("Billing address"),
            {
                "fields": [
                    "billing_street_address",
                    "billing_post_code",
                    "billing_city",
                ],
            },
        ],
        [
            _("Notes"),
            {
                "fields": [
                    "additional_information",
                    "working_memo",
                ],
            },
        ],
    ]
    inlines = [ApplicationSectionInline]
    readonly_fields = [
        "id",
        "user",
        "application_round",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(status=L("status"))
            .select_related(
                "application_round",
                "user",
            )
        )

    @admin.display(description=_("Application"), ordering="user__last_name")
    def _name(self, obj: Application) -> str:
        return str(obj)

    @admin.action(description=_("Reset application allocations"))
    def reset_applications(self, request: WSGIRequest, queryset: ApplicationQuerySet) -> TemplateResponse | None:
        # Coming from confirmation page, perform the action
        if request.POST.get("confirmed"):
            application: Application
            for application in queryset:
                application.actions.reset_application_allocation()

            msg = "Applications were reset successfully."
            self.message_user(request, msg, level=messages.INFO)
            return None

        # Show confirmation page
        context = {
            **self.admin_site.each_context(request),
            "title": _("Are you sure?"),
            "subtitle": _("Are you sure you want reset allocations for these applications?"),
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "media": self.media,
            "action_name": "reset_applications",
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(request, "admin/reset_allocation_confirmation.html", context)
