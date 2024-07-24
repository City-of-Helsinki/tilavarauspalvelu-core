from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from modeltranslation.admin import TranslationAdmin

from permissions.models import GeneralRoleChoice, GeneralRolePermission

__all__ = [
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
    # List
    list_display = [
        "verbose_name",
        "code",
    ]

    # Form
    inlines = [GeneralRolePermissionInline]
