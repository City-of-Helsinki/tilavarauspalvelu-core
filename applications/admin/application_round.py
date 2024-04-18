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
from applications.exporter.application_round_applications_exporter import ApplicationRoundApplicationsCSVExporter
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

    @button(label="Export applications to CSV")
    def export_applications_to_csv(self, request, extra_context=None) -> FileResponse | None:
        application_round_id: int | None = request.resolver_match.kwargs.get("extra_context")

        exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=application_round_id)
        try:
            response = exporter.export_as_file_response()
        except Exception as err:
            self.message_user(request, f"Error while exporting applications: {err}", level=messages.ERROR)
            SentryLogger.log_exception(err, "Error while exporting ApplicationRound applications")
            return None

        if not response:
            self.message_user(request, "No data to export for application round.", level=messages.WARNING)

        return response

    @admin.action(description=_("Reset application round allocations"))
    def reset_application_rounds(self, request: WSGIRequest, queryset: QuerySet) -> TemplateResponse | None:
        # Coming from confirmation page, perform the action
        if request.POST.get("post"):
            application_round: ApplicationRound
            for application_round in queryset:
                application_round.actions.reset_application_round_allocation()

            msg = "Application rounds were reset successfully."
            self.message_user(request, msg, level=messages.INFO)
            return None

        # Show confirmation page
        context = {
            **self.admin_site.each_context(request),
            "title": _("Are you sure?"),
            "subtitle": _("Are you sure you want reset allocations?"),
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "media": self.media,
            "action_name": "reset_application_rounds",
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(request, "admin/reset_allocation_confirmation.html", context)
