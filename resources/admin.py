from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from resources.models import Resource


@admin.register(Resource)
class ResourceAdmin(TranslationAdmin):
    pass
