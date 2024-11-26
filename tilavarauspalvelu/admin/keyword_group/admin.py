from __future__ import annotations

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import KeywordGroup


@admin.register(KeywordGroup)
class KeywordGroupAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "keyword_category",
    ]
