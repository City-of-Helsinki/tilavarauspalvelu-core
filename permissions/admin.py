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


@admin.register(GeneralRole)
class GeneralRoleAdmin(admin.ModelAdmin):
    model = GeneralRole


@admin.register(ServiceSectorRole)
class ServiceSectorRoleAdmin(admin.ModelAdmin):
    model = ServiceSectorRole
