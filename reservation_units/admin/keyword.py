from django.contrib import admin

from reservation_units.models import Keyword, KeywordCategory, KeywordGroup


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(admin.ModelAdmin):
    pass


@admin.register(KeywordGroup)
class KeywordGroupAdmin(admin.ModelAdmin):
    pass


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    pass
