from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from permissions.models import GeneralRole, GeneralRoleChoice, GeneralRolePermission

__all__ = [
    "GeneralRoleAdmin",
    "GeneralRoleChoiceAdmin",
]


class GeneralRolePermissionInline(admin.TabularInline):
    model = GeneralRolePermission
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("role")

    def has_change_permission(self, request: WSGIRequest, obj: GeneralRolePermission | None = None) -> bool:
        return False


@admin.register(GeneralRoleChoice)
class GeneralRoleChoiceAdmin(TranslationAdmin):
    list_display = [
        "verbose_name",
        "code",
    ]
    inlines = [GeneralRolePermissionInline]


@admin.register(GeneralRole)
class GeneralRoleAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "role",
    ]
    list_filter = [
        "role",
    ]

    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    search_help_text = _("Search by username, email, first name or last name")

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
