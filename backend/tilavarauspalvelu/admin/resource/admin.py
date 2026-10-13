from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Resource, Space

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(Resource)
class ResourceAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "space",
        "location_type",
    ]
    list_filter = ["location_type"]
    list_select_related = ["space__unit"]

    def formfield_for_foreignkey(self, db_field: models.ForeignKey, request: WSGIRequest, **kwargs: Any) -> Any:
        # The option label includes the unit name, so fetch the units in the same query.
        if db_field.name == "space":
            kwargs["queryset"] = Space.objects.select_related("unit")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def has_delete_permission(self, request: WSGIRequest, obj: Resource | None = None) -> bool:
        if obj is not None and obj.reservation_units.exists():
            return False

        return super().has_delete_permission(request, obj=obj)
