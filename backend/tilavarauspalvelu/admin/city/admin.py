from __future__ import annotations

from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import City


class CityAdminForm(forms.ModelForm):
    class Meta:
        model = City
        fields = [
            "name",
            "municipality_code",
        ]
        labels = {
            "name": _("Name"),
            "municipality_code": _("Municipality"),
        }
        help_texts = {
            "name": _("Name of the city."),
            "municipality_code": _("Municipality code for the city."),
        }


@admin.register(City)
class CityAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "municipality_code",
    ]

    # Form
    form = CityAdminForm
