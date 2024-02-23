from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.http import HttpRequest
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L

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

    @admin.action(description="Reset application allocations")
    def reset_applications(self, request: HttpRequest, queryset: ApplicationQuerySet) -> TemplateResponse | None:
        # Coming from confirmation page, perform the action
        if request.POST.get("post"):
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
            "subtitle": _("Are you sure you want reset allocations?"),
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "media": self.media,
            "action_name": "reset_applications",
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(request, "admin/reset_allocation_confirmation.html", context)
