from __future__ import annotations

from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import ReservationPurpose


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(SortableAdminMixin, TranslationAdmin):
    # List
    list_display = [
        "rank",
        "name",
    ]
    ordering = ["rank"]
