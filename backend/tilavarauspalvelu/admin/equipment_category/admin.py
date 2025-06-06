from __future__ import annotations

from typing import TYPE_CHECKING

from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from django.db import models
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import EquipmentCategory

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(SortableAdminMixin, TranslationAdmin):
    # List
    list_display = [
        "rank",
        "name",
        "number_of_equipment",
    ]
    ordering = ["rank"]

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
