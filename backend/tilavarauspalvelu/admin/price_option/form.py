from __future__ import annotations

from typing import Any

from django import forms
from django.core.exceptions import ValidationError

from tilavarauspalvelu.models import PriceOption
from tilavarauspalvelu.services.pricing.application_round_options import check_price_option_change_keeps_round_options

__all__ = [
    "PriceOptionAdminForm",
]


class PriceOptionAdminForm(forms.ModelForm):
    instance: PriceOption

    class Meta:
        model = PriceOption
        fields = []  # Use fields from ModelAdmin

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()

        round_option_fields = {"unit_group", "is_active"}
        if self.instance.pk is not None and not round_option_fields.intersection(self.changed_data):
            return cleaned_data

        unit_group = cleaned_data.get("unit_group")
        if unit_group is None:
            return cleaned_data

        changed_option = PriceOption(
            pk=self.instance.pk,
            name=cleaned_data.get("name_fi") or self.instance.name,
            unit_group=unit_group,
            is_active=cleaned_data.get("is_active", False),
        )
        errors = check_price_option_change_keeps_round_options(changed_option)
        if errors:
            raise ValidationError([error.message for error in errors])

        return cleaned_data
