from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import KeywordGroup

__all__ = [
    "KeywordGroupAdmin",
]


@admin.register(KeywordGroup)
class KeywordGroupAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "keyword_category",
    ]
