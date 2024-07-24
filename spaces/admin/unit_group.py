from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from spaces.models import UnitGroup

__all__ = [
    "UnitGroupAdmin",
]


@admin.register(UnitGroup)
class UnitGroupAdmin(TranslationAdmin):
    # Functions
    search_fields = ["name"]
    search_help_text = _("Search by name")

    # List
    list_display = [
        "name",
        "number_of_units",
    ]
    ordering = ["name"]

    # Form
    fields = [
        "name",
        "units",
    ]
    filter_horizontal = ["units"]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(
                number_of_units=models.Count("units"),
            )
        )

    @admin.display(description="Number of units", ordering="number_of_units")
    def number_of_units(self, obj: UnitGroup) -> str:
        return getattr(obj, "number_of_units", -1)
