from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from resources.models import Resource


@admin.register(Resource)
class ResourceAdmin(TranslationAdmin):
    list_display = [
        "name",
        "space",
        "location_type",
        "buffer_time_before",
        "buffer_time_after",
    ]
    list_filter = [
        "location_type",
    ]
