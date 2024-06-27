from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from modeltranslation.admin import TranslationAdmin
from mptt.admin import MPTTModelAdmin

from spaces.admin.location import LocationInline
from spaces.models import Space

__all__ = [
    "SpaceAdmin",
]


class SpaceInline(admin.StackedInline):
    model = Space
    fields = [
        "name",
        "surface_area",
        "max_persons",
        "code",
        "unit",
        "parent",
    ]
    extra = 0
    show_change_link = True

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("unit", "parent")


@admin.register(Space)
class SpaceAdmin(TranslationAdmin, MPTTModelAdmin):
    fields = [
        "name",
        "surface_area",
        "max_persons",
        "code",
        "unit",
        "parent",
    ]
    list_display = [
        "name",
    ]
    inlines = [
        SpaceInline,
        LocationInline,
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("unit", "parent")
