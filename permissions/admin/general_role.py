from django.contrib import admin
from django.db import models
from django.http import HttpRequest

from permissions.models import GeneralRole, GeneralRoleChoice, GeneralRolePermission

__all__ = [
    "GeneralRoleAdmin",
    "GeneralRoleChoiceAdmin",
]


class GeneralRolePermissionInline(admin.TabularInline):
    model = GeneralRolePermission
    extra = 0

    def get_queryset(self, request: HttpRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("role")

    def has_change_permission(self, request: HttpRequest, obj: GeneralRolePermission | None = None) -> bool:
        return False


@admin.register(GeneralRoleChoice)
class GeneralRoleChoiceAdmin(admin.ModelAdmin):
    model = GeneralRoleChoice
    inlines = [GeneralRolePermissionInline]


@admin.register(GeneralRole)
class GeneralRoleAdmin(admin.ModelAdmin):
    model = GeneralRole
    list_filter = [
        "role",
    ]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    autocomplete_fields = [
        "user",
    ]

    def get_queryset(self, request: HttpRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("user", "role")
