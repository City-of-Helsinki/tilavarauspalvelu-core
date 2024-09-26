from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.db.models import QuerySet
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from rangefilter.filters import DateRangeFilterBuilder

from common.typing import WSGIRequest
from tilavarauspalvelu.admin.application.filters import (
    ApplicationRoundFilter,
    ApplicationRoundStatusFilter,
    ApplicationStatusFilter,
)
from tilavarauspalvelu.admin.application.form import ApplicationAdminForm
from tilavarauspalvelu.admin.application_section.admin import ApplicationSectionInline
from tilavarauspalvelu.models import Application
from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    # Functions
    actions = ["reset_applications"]
    search_fields = [
        "user__first_name",
        "user__last_name",
        "application_round__reservation_units__name",
    ]
    search_help_text = _("Search by user's first name, last name or reservation units name")

    # List
    list_display = [
        "id",
        "_name",
        "application_round",
        "created_date",
        "last_modified_date",
    ]
    list_filter = [
        ("created_date", DateRangeFilterBuilder(title=_("Created at"))),
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
                ],
            },
        ],
        [
            _("Applicant"),
            {
                "fields": [
                    "applicant_type",
                    "organisation",
                    "contact_person",
                    "user",
                    "billing_address",
                    "home_city",
                ],
            },
        ],
        [
            _("Time"),
            {
                "fields": [
                    "sent_date",
                    "cancelled_date",
                    "in_allocation_notification_sent_date",
                    "results_ready_notification_sent_date",
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
    readonly_fields = ["id"]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(status=L("status"))
            .select_related(
                "application_round",
                "organisation",
                "contact_person",
                "user",
                "home_city",
                "billing_address",
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
