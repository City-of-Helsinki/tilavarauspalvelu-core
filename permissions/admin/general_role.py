from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext_lazy as _

from permissions.models import GeneralRole

__all__ = [
    "GeneralRoleAdmin",
]


@admin.register(GeneralRole)
class GeneralRoleAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    search_help_text = _("Search by username, email, first name or last name")

    # List
    list_display = [
        "user",
        "role",
    ]
    list_filter = ["role"]

    # Form
    fields = [
        "user",
        "role",
        "assigner",
        "created",
        "modified",
    ]
    readonly_fields = [
        "created",
        "modified",
    ]
    autocomplete_fields = [
        "user",
        "assigner",
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("user", "role")
