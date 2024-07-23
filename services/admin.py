from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from services.models import Service


@admin.register(Service)
class ServiceAdmin(TranslationAdmin):
    list_display = [
        "name",
        "service_type",
        "buffer_time_before",
        "buffer_time_after",
    ]
    list_filter = [
        "service_type",
    ]
