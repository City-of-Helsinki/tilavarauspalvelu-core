from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Equipment, EquipmentCategory


@admin.register(Equipment)
class EquipmentAdmin(TranslationAdmin):
    list_display = [
        "name",
        "category",
    ]
    list_filter = [
        "category",
    ]


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(TranslationAdmin):
    list_display = [
        "name",
        "number_of_equipment",
    ]

    @admin.display(ordering="number_of_equipment")
    def number_of_equipment(self, obj: EquipmentCategory) -> str:
        return getattr(obj, "number_of_equipment", -1)

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(
                number_of_equipment=models.Count("equipment"),
            )
        )
