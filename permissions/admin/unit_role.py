from django.contrib import admin
from django.db import models
from django.http import HttpRequest

from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission

__all__ = [
    "UnitRoleAdmin",
    "UnitRoleChoiceAdmin",
]


class UnitRolePermissionInline(admin.TabularInline):
    model = UnitRolePermission
    extra = 0

    def get_queryset(self, request: HttpRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("role")

    def has_change_permission(self, request: HttpRequest, obj: UnitRolePermission | None = None) -> bool:
        return False


@admin.register(UnitRoleChoice)
class UnitRoleChoiceAdmin(admin.ModelAdmin):
    model = UnitRoleChoice
    inlines = [UnitRolePermissionInline]


@admin.register(UnitRole)
class UnitRoleAdmin(admin.ModelAdmin):
    model = UnitRole
    list_display = [
        "__str__",
        "unit_names",
        "unit_group_names",
    ]
    list_filter = [
        "role",
        "unit",
        "unit_group",
    ]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "unit__name",
        "unit_group__name",
    ]
    autocomplete_fields = [
        "user",
    ]
    filter_horizontal = [
        "unit",
        "unit_group",
    ]

    def get_queryset(self, request: HttpRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("user", "role").prefetch_related("unit", "unit_group")

    @staticmethod
    def unit_names(obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit.all()])

    @staticmethod
    def unit_group_names(obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit_group.all()])
