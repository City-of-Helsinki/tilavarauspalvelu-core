from __future__ import annotations

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import KeywordCategory


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(TranslationAdmin):
    # List
    list_display = ["name"]
