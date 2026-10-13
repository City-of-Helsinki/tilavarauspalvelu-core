from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin
from mptt.admin import MPTTModelAdmin

from tilavarauspalvelu.models import Space

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest


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
        return super().get_queryset(request).select_related("unit", "parent__unit")

    def formfield_for_foreignkey(self, db_field: models.ForeignKey, request: WSGIRequest, **kwargs: Any) -> Any:
        # The option label includes the unit name, so fetch the units in the same query.
        if db_field.name == "parent":
            kwargs["queryset"] = Space.objects.select_related("unit")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


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
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("unit", "parent__unit")

    def formfield_for_foreignkey(self, db_field: models.ForeignKey, request: WSGIRequest, **kwargs: Any) -> Any:
        # The option label includes the unit name, so fetch the units in the same query.
        if db_field.name == "parent":
            kwargs["queryset"] = Space.objects.select_related("unit")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def has_delete_permission(self, request: WSGIRequest, obj: Space | None = None) -> bool:
        if obj is not None and obj.reservation_units.exists():
            return False

        return super().has_delete_permission(request, obj=obj)
