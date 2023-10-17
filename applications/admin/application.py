from django.contrib import admin

from applications.admin.forms.application import ApplicationAdminForm
from applications.models import Application

__all__ = [
    "ApplicationAdmin",
]


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
    ]
    search_fields = [
        "application_round__name",
        "user__first_name",
        "user__last_name",
    ]
