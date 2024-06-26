from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.http import HttpRequest
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from applications.admin.filters.application import (
    ApplicationRoundFilter,
    ApplicationRoundStatusFilter,
    ApplicationStatusFilter,
)
from applications.admin.forms.application import ApplicationAdminForm
from applications.admin.forms.application_section import ApplicationSectionInlineAdminForm
from applications.models import Application, ApplicationSection
from applications.querysets.application import ApplicationQuerySet
from common.utils import comma_sep_str

__all__ = [
    "ApplicationAdmin",
]


class ApplicationSectionInline(admin.TabularInline):
    model = ApplicationSection
    form = ApplicationSectionInlineAdminForm
    extra = 0
    show_change_link = True
    can_delete = False

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(status=L("status")).prefetch_related("suitable_time_ranges")

    def has_change_permission(self, request: WSGIRequest, obj: ApplicationSection | None = None) -> bool:
        return False

    def has_add_permission(self, request: WSGIRequest, obj: ApplicationSection | None = None) -> bool:
        return False

    def suitable_days_of_the_week(self, obj: ApplicationSection) -> str:
        return comma_sep_str(item.label for item in obj.suitable_days_of_the_week)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    form = ApplicationAdminForm
    list_display = [
        "_name",
        "application_round",
        "created_date",
        "last_modified_date",
    ]
    list_filter = [
        ApplicationStatusFilter,
        ApplicationRoundStatusFilter,
        ApplicationRoundFilter,
    ]
    search_fields = [
        "user__first_name",
        "user__last_name",
        "application_round__reservation_units__name",
    ]
    actions = [
        "reset_applications",
    ]
    inlines = [
        ApplicationSectionInline,
    ]

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
            "subtitle": _("Are you sure you want reset allocations for these applications?"),
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "media": self.media,
            "action_name": "reset_applications",
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(request, "admin/reset_allocation_confirmation.html", context)
