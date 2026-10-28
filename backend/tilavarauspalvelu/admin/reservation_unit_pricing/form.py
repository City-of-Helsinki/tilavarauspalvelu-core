from __future__ import annotations

from typing import TYPE_CHECKING

from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.models import ReservationUnitPricing
from utils.date_utils import local_date

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TaxLevel


class ReservationUnitPricingAdminForm(forms.ModelForm):
    class Meta:
        model = ReservationUnitPricing
        fields = []  # Use fields from ModelAdmin
        widgets = {
            "material_price_description": TinyMCE(mce_attrs={"height": "250px"}),
        }

    def clean_tax_level(self) -> TaxLevel:
        tax_level: TaxLevel = self.cleaned_data["tax_level"]

        today = local_date()
        has_rate = tax_level.rates.effective_on(on_date=today).exists()
        if not has_rate:
            msg = _("This tax level has no rate in effect today.")
            raise ValidationError(msg)

        return tax_level
