from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Resource

if TYPE_CHECKING:
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

    def has_delete_permission(self, request: WSGIRequest, obj: Resource | None = None) -> bool:
        if obj is not None and obj.reservation_units.exists():
            return False

        return super().has_delete_permission(request, obj=obj)
