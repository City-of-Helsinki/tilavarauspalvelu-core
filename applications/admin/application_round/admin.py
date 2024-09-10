from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.db.models import QuerySet
from django.http import FileResponse
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from modeltranslation.admin import TranslationAdmin

from applications.admin.application_round.form import ApplicationRoundAdminForm
from applications.enums import ApplicationRoundStatusChoice
from applications.exporter.application_round_applications_exporter import ApplicationRoundApplicationsCSVExporter
from applications.exporter.application_round_result_exporter import ApplicationRoundResultCSVExporter
from applications.models import ApplicationRound
from common.typing import WSGIRequest
from utils.sentry import SentryLogger

__all__ = [
    "ApplicationRoundAdmin",
]


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(ExtraButtonsMixin, TranslationAdmin):
    # Functions
    actions = ["reset_application_rounds"]

    # List
    list_display = [
        "name",
        "reservation_period_begin",
        "reservation_period_end",
        "_status",
        "handled_date",
        "sent_date",
    ]
    list_filter = ["_status"]
    ordering = ["-reservation_period_begin"]

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
                    "application_period_begin",
                    "application_period_end",
                    "reservation_period_begin",
                    "reservation_period_end",
                    "public_display_begin",
                    "public_display_end",
                    "handled_date",
                    "sent_date",
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

    @button(label="Export applications to CSV", change_form=True)
    def export_applications_to_csv(self, request: WSGIRequest, pk: int) -> FileResponse | None:
        exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=pk)
        try:
            response = exporter.export_as_file_response()
        except Exception as err:
            self.message_user(request, f"Error while exporting applications: {err}", level=messages.ERROR)
            SentryLogger.log_exception(err, "Error while exporting ApplicationRound applications")
            return None

        if not response:
            self.message_user(request, "No data to export for application round.", level=messages.WARNING)

        return response

    @button(label="Export results to CSV", change_form=True)
    def export_results_to_csv(self, request: WSGIRequest, pk: int) -> FileResponse | None:
        exporter = ApplicationRoundResultCSVExporter(application_round_id=pk)
        try:
            response = exporter.export_as_file_response()
        except Exception as err:
            self.message_user(request, f"Error while exporting results: {err}", level=messages.ERROR)
            SentryLogger.log_exception(err, "Error while exporting ApplicationRound results")
            return None

        if not response:
            self.message_user(request, "No data to export for application round.", level=messages.WARNING)

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
