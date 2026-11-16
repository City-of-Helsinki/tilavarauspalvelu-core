from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Equipment


@admin.register(Equipment)
class EquipmentAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "category",
    ]
    list_filter = ["category"]
