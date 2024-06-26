from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.http import FileResponse
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from modeltranslation.admin import TranslationAdmin

from applications.admin.forms.application_round import ApplicationRoundAdminForm
from applications.choices import ApplicationRoundStatusChoice
from applications.exporter.application_round_applications_exporter import ApplicationRoundApplicationsCSVExporter
from applications.exporter.application_round_result_exporter import ApplicationRoundResultCSVExporter
from applications.models import ApplicationRound
from utils.sentry import SentryLogger

__all__ = [
    "ApplicationRoundAdmin",
]


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(ExtraButtonsMixin, TranslationAdmin):
    form = ApplicationRoundAdminForm
    list_display = [
        "_name",
    ]
    actions = [
        "reset_application_rounds",
    ]
    autocomplete_fields = [
        "reservation_units",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(
                status=L("status"),
            )
            .select_related("service_sector")
        )

    @admin.display(description=_("Application Round"), ordering="name")
    def _name(self, obj: ApplicationRound) -> str:
        return str(obj)

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
