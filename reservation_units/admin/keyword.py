from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Keyword

__all__ = [
    "KeywordAdmin",
]


@admin.register(Keyword)
class KeywordAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "keyword_group",
    ]
