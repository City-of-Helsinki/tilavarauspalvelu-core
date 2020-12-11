from django.contrib import admin

from .models import Building, District, Location, RealEstate, Space


class LocationInline(admin.TabularInline):
    model = Location
    fields = ["address_street", "address_zip", "address_city"]


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    model = District


@admin.register(RealEstate)
class RealEstateAdmin(admin.ModelAdmin):
    model = RealEstate
    inlines = [LocationInline]


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    model = Building
    inlines = [LocationInline]


@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    model = Space
    inlines = [LocationInline]
