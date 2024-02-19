from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.http import FileResponse, HttpRequest
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from applications.exporter import export_application_data
from applications.models import ApplicationRound
from applications.querysets.application_round import ApplicationRoundQuerySet
from utils.sentry import SentryLogger

from .forms.application_round import ApplicationRoundAdminForm

__all__ = [
    "ApplicationRoundAdmin",
]


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(TranslationAdmin):
    form = ApplicationRoundAdminForm
    actions = ["export_to_csv", "reset_application_rounds"]
    autocomplete_fields = ["reservation_units"]

    @admin.action(description="Export application events in the selected application round to CSV")
    def export_to_csv(self, request, queryset):
        try:
            app_round = queryset.first()
            path = export_application_data(application_round_id=app_round)

        except Exception as err:
            self.message_user(
                request,
                f"Error while exporting applications: {err}",
                level=messages.ERROR,
            )
            SentryLogger.log_exception(err, "Error while exporting applications")
        else:
            if path:
                # Filehandler needs to be left open for Django to be able to stream the file
                # Should fix the exporter to use an in-memory stream instead of writing to a file.
                return FileResponse(open(path, "rb"))  # noqa: SIM115

            self.message_user(
                request,
                "No export data in selected application round.",
                level=messages.INFO,
            )

    @admin.action(description="Reset application round allocations")
    def reset_application_rounds(
        self,
        request: HttpRequest,
        queryset: ApplicationRoundQuerySet,
    ) -> TemplateResponse | None:
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
