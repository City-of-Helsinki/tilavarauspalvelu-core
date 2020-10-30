from django.contrib import admin
from .models import District, Building, Space


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    model = District


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    model = Building


@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    model = Space
