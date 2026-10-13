from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.db import models

from tilavarauspalvelu.models import ReservationUnit, ReservationUnitImage

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


class ReservationUnitImageInline(admin.TabularInline):
    model = ReservationUnitImage
    readonly_fields = ["large_url", "medium_url", "small_url"]
    extra = 0


@admin.register(ReservationUnitImage)
class ReservationUnitImageAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "reservation_unit",
        "image_type",
    ]
    list_filter = [
        "image_type",
    ]
    list_select_related = ["reservation_unit__unit"]

    # Form
    formfield_overrides = {
        models.URLField: {"assume_scheme": "https"},
    }

    def formfield_for_foreignkey(self, db_field: models.ForeignKey, request: WSGIRequest, **kwargs: Any) -> Any:
        # The option label includes the unit name, so fetch the units in the same query.
        if db_field.name == "reservation_unit":
            kwargs["queryset"] = ReservationUnit.objects.select_related("unit")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
