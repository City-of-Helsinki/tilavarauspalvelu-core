from django.contrib import admin

from .models import (
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)


class UnitRolePermissionInline(admin.TabularInline):
    model = UnitRolePermission


class ServiceSectorRolePermissionInline(admin.TabularInline):
    model = ServiceSectorRolePermission


class GeneralRolePermissionInline(admin.TabularInline):
    model = GeneralRolePermission


@admin.register(UnitRoleChoice)
class UnitRoleChoiceAdmin(admin.ModelAdmin):
    model = UnitRoleChoice
    inlines = [UnitRolePermissionInline]


@admin.register(ServiceSectorRoleChoice)
class ServiceSectorRoleChoiceAdmin(admin.ModelAdmin):
    model = ServiceSectorRoleChoice
    inlines = [ServiceSectorRolePermissionInline]


@admin.register(GeneralRoleChoice)
class GeneralRoleChoiceAdmin(admin.ModelAdmin):
    model = GeneralRoleChoice
    inlines = [GeneralRolePermissionInline]


@admin.register(UnitRole)
class UnitRoleAdmin(admin.ModelAdmin):
    model = UnitRole
    list_filter = ["role"]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    autocomplete_fields = ["user", "unit", "unit_group"]


@admin.register(GeneralRole)
class GeneralRoleAdmin(admin.ModelAdmin):
    model = GeneralRole
    list_filter = ["role"]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    autocomplete_fields = ["user"]


@admin.register(ServiceSectorRole)
class ServiceSectorRoleAdmin(admin.ModelAdmin):
    model = ServiceSectorRole
    list_filter = ["role"]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    autocomplete_fields = ["user"]
