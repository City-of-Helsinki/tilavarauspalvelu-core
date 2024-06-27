from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from modeltranslation.admin import TranslationAdmin

from spaces.models import ServiceSector


@admin.register(ServiceSector)
class ServiceSectorAdmin(TranslationAdmin):
    fields = [
        "name",
        "units",
    ]
    list_display = [
        "name",
        "number_of_units",
    ]
    filter_horizontal = [
        "units",
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(
                number_of_units=models.Count("units"),
            )
        )

    @admin.display(description="Number of units", ordering="number_of_units")
    def number_of_units(self, obj: ServiceSector) -> str:
        return getattr(obj, "number_of_units", -1)
