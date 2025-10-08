from __future__ import annotations

from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import IntendedUse


@admin.register(IntendedUse)
class IntendedUseAdmin(SortableAdminMixin, TranslationAdmin):
    # List
    list_display = [
        "rank",
        "name",
        "image",
    ]
    ordering = ["rank"]
