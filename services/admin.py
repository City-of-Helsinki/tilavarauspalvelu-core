from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from services.models import Service


@admin.register(Service)
class ServiceAdmin(TranslationAdmin):
    pass
