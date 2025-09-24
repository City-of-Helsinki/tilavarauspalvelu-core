from __future__ import annotations

from typing import TYPE_CHECKING

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from modeltranslation.admin import TabbedTranslationAdmin

from tilavarauspalvelu.admin.application_round.form import ApplicationRoundAdminForm
from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import ApplicationRound
from tilavarauspalvelu.services.export import ApplicationRoundApplicationsCSVExporter, ApplicationRoundResultCSVExporter

if TYPE_CHECKING:
    from django.db.models import QuerySet
    from django.http import FileResponse

    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(ExtraButtonsMixin, TabbedTranslationAdmin):
    # Functions
    actions = ["reset_application_rounds"]

    # List
    list_display = [
        "name",
        "reservation_period_begin_date",
        "reservation_period_end_date",
        "status",
        "handled_at",
        "sent_at",
    ]
    list_filter = ["_lookup_property_status"]
    ordering = ["-reservation_period_begin_date"]

    # Form
    form = ApplicationRoundAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "name",
                    "status",
                    "terms_of_use",
                    "reservation_units",
                    "purposes",
                ],
            },
        ],
        [
            _("Time"),
            {
                "fields": [
                    "application_period_begins_at",
                    "application_period_ends_at",
                    "reservation_period_begin_date",
                    "reservation_period_end_date",
                    "public_display_begins_at",
                    "public_display_ends_at",
                    "handled_at",
                    "sent_at",
                ],
            },
        ],
        [
            _("Criteria"),
            {
                "fields": ["criteria"],
            },
        ],
        [
            _("Notes"),
            {
                "fields": ["notes_when_applying"],
            },
        ],
    ]
    readonly_fields = ["id"]
    filter_horizontal = [
        "reservation_units",
        "purposes",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(
                status=L("status"),
            )
        )

    @admin.display(ordering=L("status"))
    def status(self, obj: ApplicationRound) -> str:
        return obj.status

    @button(label="Export applications to CSV", change_form=True)
    def export_applications_to_csv(self, request: WSGIRequest, pk: int) -> FileResponse | None:
        try:
            exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=pk)
            response = exporter.to_file_response()
        except Exception as error:  # noqa: BLE001
            self.message_user(request, f"Error while exporting applications: {error}", level=messages.ERROR)
            SentryLogger.log_exception(error, "Error while exporting ApplicationRound applications")
            return None

        return response

    @button(label="Export results to CSV", change_form=True)
    def export_results_to_csv(self, request: WSGIRequest, pk: int) -> FileResponse | None:
        try:
            exporter = ApplicationRoundResultCSVExporter(application_round_id=pk)
            response = exporter.to_file_response()
        except Exception as error:  # noqa: BLE001
            self.message_user(request, f"Error while exporting results: {error}", level=messages.ERROR)
            SentryLogger.log_exception(error, "Error while exporting ApplicationRound results")
            return None

        return response

    @admin.action(description=_("Reset application round"))
    def reset_application_rounds(self, request: WSGIRequest, queryset: QuerySet) -> TemplateResponse | None:
        # Coming from confirmation page, perform the action
        if request.POST.get("confirmed"):
            application_round: ApplicationRound

            proceed = True
            for application_round in queryset:
                if not ApplicationRoundStatusChoice(application_round.status).allows_resetting:
                    msg = (
                        f"Application round {application_round.name!r} is in status "
                        f"{application_round.status!r} and cannot be reset."
                    )
                    self.message_user(request, msg, level=messages.ERROR)
                    proceed = False

            if not proceed:
                return None

            for application_round in queryset:
                application_round.actions.reset_application_round_allocation()

            msg = "Application rounds were reset successfully."
            self.message_user(request, msg, level=messages.INFO)
            return None

        # Show confirmation page
        context = {
            **self.admin_site.each_context(request),
            "title": _("Are you sure?"),
            "subtitle": _("Are you sure you want to reset these application rounds?"),
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "media": self.media,
            "action_name": "reset_application_rounds",
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(request, "admin/reset_allocation_confirmation.html", context)
