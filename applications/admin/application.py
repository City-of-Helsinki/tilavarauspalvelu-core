from django.contrib import admin, messages
from django.http import HttpRequest

from applications.admin.forms.application import ApplicationAdminForm
from applications.models import Application

__all__ = [
    "ApplicationAdmin",
]

from applications.querysets.application import ApplicationQuerySet


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    form = ApplicationAdminForm
    list_display = [
        "__str__",
        "application_round",
        "created_date",
        "last_modified_date",
    ]
    list_filter = [
        "application_round",
        "application_round__reservation_units__name",
    ]
    search_fields = [
        "user__first_name",
        "user__last_name",
        "application_round__reservation_units__name",
    ]
    actions = ["reset_applications"]

    @admin.action(description="Reset application allocations")
    def reset_applications(self, request: HttpRequest, queryset: ApplicationQuerySet) -> None:
        application: Application
        for application in queryset:
            application.actions.reset_application_allocation()

        msg = "Applications were reset successfully."
        self.message_user(request, msg, level=messages.INFO)
