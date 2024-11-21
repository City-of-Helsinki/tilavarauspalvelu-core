from django.contrib import admin
from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import GeneralRole
from tilavarauspalvelu.typing import WSGIRequest

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
        "role",
        "user_email",
        "role_active",
    ]
    list_filter = [
        "role",
        "role_active",
    ]

    # Form
    fields = [
        "role_active",
        "role",
        "user",
        "assigner",
        "created",
        "modified",
    ]
    readonly_fields = [
        "assigner",
        "created",
        "modified",
        "assigner",
    ]
    autocomplete_fields = [
        "user",
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .select_related(
                "user",
                "assigner",
            )
        )

    def save_model(self, request: WSGIRequest, obj: GeneralRole, form, change: bool) -> GeneralRole:  # noqa: FBT001
        obj.assigner = request.user
        return super().save_model(request, obj, form, change)

    @admin.display(ordering="user__email")
    def user_email(self, obj: GeneralRole) -> str:
        return obj.user.email
