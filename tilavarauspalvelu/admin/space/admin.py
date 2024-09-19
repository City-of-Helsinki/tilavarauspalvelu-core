from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin
from mptt.admin import MPTTModelAdmin

from tilavarauspalvelu.admin.location.admin import LocationInline
from tilavarauspalvelu.models import Space


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
    # Functions
    search_fields = [
        "name",
        "unit__name",
    ]
    search_help_text = _("Search by name or unit name")

    # List
    list_display = [
        "name",
        "unit",
        "parent",
    ]
    ordering = ["name"]

    # Form
    fields = [
        "name",
        "surface_area",
        "max_persons",
        "code",
        "unit",
        "parent",
    ]
    inlines = [
        SpaceInline,
        LocationInline,
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("unit", "parent")
