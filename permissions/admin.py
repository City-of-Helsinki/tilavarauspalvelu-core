from django.contrib import admin

from permissions.models import (
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
    list_display = ["__str__", "unit_names", "unit_group_names", "service_sector_names"]
    list_filter = ["role", "unit", "unit_group"]
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    ]
    autocomplete_fields = ["user", "unit", "unit_group"]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .prefetch_related(
                "unit",
                "unit_group",
                "unit__service_sectors",
                "unit_group__units__service_sectors",
            )
        )

    @staticmethod
    def unit_names(obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit.all()])

    @staticmethod
    def unit_group_names(obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit_group.all()])

    @staticmethod
    def service_sector_names(obj: UnitRole) -> str:
        return ", ".join(
            sorted(
                set(
                    [service_sector.name for unit in obj.unit.all() for service_sector in unit.service_sectors.all()]
                    + [
                        service_sector.name
                        for unit in obj.unit_group.all()
                        for unit in unit.units.all()
                        for service_sector in unit.service_sectors.all()
                    ]
                )
            )
        )


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
