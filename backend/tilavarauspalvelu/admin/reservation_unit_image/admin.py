from __future__ import annotations

from django.contrib import admin
from django.db import models

from tilavarauspalvelu.models import ReservationUnitImage


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

    # Form
    formfield_overrides = {
        models.URLField: {"assume_scheme": "https"},
    }
