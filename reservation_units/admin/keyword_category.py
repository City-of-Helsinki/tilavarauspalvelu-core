from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import KeywordCategory

__all__ = [
    "KeywordCategoryAdmin",
]


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(TranslationAdmin):
    # List
    list_display = ["name"]
