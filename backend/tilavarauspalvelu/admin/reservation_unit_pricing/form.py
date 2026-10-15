from __future__ import annotations

from django import forms
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.models import ReservationUnitPricing


class ReservationUnitPricingAdminForm(forms.ModelForm):
    class Meta:
        model = ReservationUnitPricing
        fields: list[str] = []  # Use fields from ModelAdmin
        widgets = {
            "material_price_description": TinyMCE(mce_attrs={"height": "250px"}),
        }
