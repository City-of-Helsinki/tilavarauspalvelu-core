from django.contrib import admin, messages
from django.http import FileResponse
from modeltranslation.admin import TranslationAdmin
from sentry_sdk import capture_exception

from applications.exporter import ApplicationDataExporter
from applications.models import ApplicationRound

from .forms.application_round import ApplicationRoundAdminForm

__all__ = [
    "ApplicationRoundAdmin",
]


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(TranslationAdmin):
    form = ApplicationRoundAdminForm

    actions = ["export_to_csv"]

    autocomplete_fields = [
        "reservation_units",
    ]

    @admin.action(description="Export application events in the selected application round to CSV")
    def export_to_csv(self, request, queryset):
        try:
            app_round = queryset.first()
            path = ApplicationDataExporter.export_application_data(application_round_id=app_round)

        except Exception as e:
            self.message_user(
                request,
                f"Error while exporting applications: {e}",
                level=messages.ERROR,
            )

            capture_exception(e)
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
