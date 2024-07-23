from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Keyword, KeywordCategory, KeywordGroup


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(TranslationAdmin):
    pass


@admin.register(KeywordGroup)
class KeywordGroupAdmin(TranslationAdmin):
    pass


@admin.register(Keyword)
class KeywordAdmin(TranslationAdmin):
    pass
