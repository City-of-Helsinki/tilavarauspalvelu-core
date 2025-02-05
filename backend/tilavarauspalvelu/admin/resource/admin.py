from __future__ import annotations

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Resource


@admin.register(Resource)
class ResourceAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "space",
        "location_type",
    ]
    list_filter = ["location_type"]
