from django.conf import settings
from django.contrib import admin, messages
from django.core.management import call_command
from mptt.admin import MPTTModelAdmin

from .models import (
    Building,
    District,
    Location,
    RealEstate,
    ServiceSector,
    Space,
    Unit,
    UnitGroup,
)


class LocationInline(admin.TabularInline):
    model = Location
    fields = ["address_street", "address_zip", "address_city", "coordinates"]


class DistrictInline(admin.TabularInline):
    model = District


class SpaceInline(admin.TabularInline):
    model = Space


@admin.register(District)
class DistrictAdmin(MPTTModelAdmin):
    model = District
    inlines = [DistrictInline]


@admin.register(RealEstate)
class RealEstateAdmin(admin.ModelAdmin):
    model = RealEstate
    inlines = [LocationInline]


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    model = Building
    inlines = [LocationInline]


@admin.register(Space)
class SpaceAdmin(MPTTModelAdmin):
    model = Space
    inlines = [LocationInline, SpaceInline]


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    model = Unit
    inlines = [LocationInline]
    actions = ["update_from_tprek"]

    @admin.action
    def update_from_tprek(self, request, queryset):
        ids = queryset.filter(tprek_id__isnull=False).values_list("tprek_id", flat=True)
        try:
            output = call_command(
                "import_units", settings.TPREK_UNIT_URL, "--ids", *ids
            )
        except Exception as e:
            self.message_user(
                request, f"Error while importing units: {e}", level=messages.ERROR
            )
        else:
            self.message_user(request, output, level=messages.SUCCESS)


@admin.register(UnitGroup)
class UnitGroupAdmin(admin.ModelAdmin):
    model = UnitGroup


@admin.register(ServiceSector)
class ServiceSectorAdmin(admin.ModelAdmin):
    model = ServiceSector
