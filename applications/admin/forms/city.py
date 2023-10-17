from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import City

__all__ = [
    "CityAdminForm",
]


class CityAdminForm(forms.ModelForm):
    class Meta:
        model = City
        fields = [
            "name",
            "municipality_code",
        ]
        help_texts = {
            "name": _("Name of the city."),
            "municipality_code": _("Municipality code for the city."),
        }
