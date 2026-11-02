from __future__ import annotations

import datetime

from django import forms
from django.core.exceptions import ValidationError
from django.forms.formsets import DELETION_FIELD_NAME
from django.forms.models import BaseInlineFormSet
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import TaxLevelRate
from utils.date_utils import local_date

__all__ = [
    "TaxLevelRateForm",
    "TaxLevelRateFormSet",
]


class TaxLevelRateForm(forms.ModelForm):
    class Meta:
        model = TaxLevelRate
        fields = [
            "begins",
            "percentage",
        ]
        labels = {
            "begins": _("Begin date"),
            "percentage": _("Tax percentage"),
        }


class TaxLevelRateFormSet(BaseInlineFormSet):
    def clean(self) -> None:
        super().clean()

        today = local_date()
        has_rate_today = any(
            form.cleaned_data.get("begins", datetime.date.max) <= today
            for form in self.forms
            if not form.cleaned_data.get(DELETION_FIELD_NAME, False)
        )
        if not has_rate_today:
            msg = _("At least one rate in effect today is required.")
            raise ValidationError(msg)
