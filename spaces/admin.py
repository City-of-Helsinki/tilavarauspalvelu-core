from django.contrib import admin
from mptt.admin import MPTTModelAdmin

from .models import Building, District, Location, RealEstate, Space


class LocationInline(admin.TabularInline):
    model = Location
    fields = ["address_street", "address_zip", "address_city"]


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
