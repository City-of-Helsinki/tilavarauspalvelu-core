from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from applications.models import City

from .forms.city import CityAdminForm

__all__ = [
    "CityAdmin",
]


@admin.register(City)
class CityAdmin(TranslationAdmin):
    form = CityAdminForm

    list_display = [
        "name",
        "municipality_code",
    ]
