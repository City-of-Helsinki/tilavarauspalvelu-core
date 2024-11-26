from __future__ import annotations

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Keyword


@admin.register(Keyword)
class KeywordAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "keyword_group",
    ]
