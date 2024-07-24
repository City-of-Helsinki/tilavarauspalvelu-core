from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from reservations.models import ReservationMetadataSet

__all__ = [
    "ReservationMetadataSetAdmin",
]


class ReservationMetadataSetForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataSet
        fields = [
            "name",
            "supported_fields",
            "required_fields",
        ]

    def clean(self):
        supported = set(self.cleaned_data.get("supported_fields"))
        required = set(self.cleaned_data.get("required_fields"))
        if not required.issubset(supported):
            raise ValidationError(_("Required fields must be a subset of supported fields"))
        return self.cleaned_data


@admin.register(ReservationMetadataSet)
class ReservationMetadataSetAdmin(admin.ModelAdmin):
    # Form
    form = ReservationMetadataSetForm
    filter_horizontal = [
        "supported_fields",
        "required_fields",
    ]
