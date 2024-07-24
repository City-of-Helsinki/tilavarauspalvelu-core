from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Equipment

__all__ = [
    "EquipmentAdmin",
]


@admin.register(Equipment)
class EquipmentAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "category",
    ]
    list_filter = ["category"]
