from django.contrib import admin

from reservation_units.models import Equipment, EquipmentCategory


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    model = Equipment


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    model = EquipmentCategory
