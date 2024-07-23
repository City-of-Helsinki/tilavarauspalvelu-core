from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Keyword, KeywordCategory, KeywordGroup


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(TranslationAdmin):
    list_display = [
        "name",
    ]


@admin.register(KeywordGroup)
class KeywordGroupAdmin(TranslationAdmin):
    list_display = [
        "name",
        "keyword_category",
    ]


@admin.register(Keyword)
class KeywordAdmin(TranslationAdmin):
    list_display = [
        "name",
        "keyword_group",
    ]
