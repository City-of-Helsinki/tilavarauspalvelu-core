from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from django import forms
from django.core.exceptions import ValidationError
from django.forms.formsets import DELETION_FIELD_NAME
from django.forms.models import BaseInlineFormSet
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import TaxLevelRate
from utils.date_utils import local_date

if TYPE_CHECKING:
    from django.forms import ModelForm
    from django.forms.renderers import BaseRenderer
    from django.utils.safestring import SafeString

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
        help_texts = {
            "begins": _(
                "The date when the rate takes effect. "
                "Rates that began before today cannot be changed or deleted. "
                "To change the tax percentage, add a new rate."
            ),
        }


class ReadOnlyTextWidget(forms.Widget):
    """Show the value as plain text, in the same format as the given input widget."""

    def __init__(self, *, input_widget: forms.Widget) -> None:
        super().__init__()
        self.input_widget = input_widget

    def render(
        self,
        name: str,
        value: Any,
        attrs: dict[str, Any] | None = None,  # noqa: ARG002
        renderer: BaseRenderer | None = None,  # noqa: ARG002
    ) -> SafeString:
        text = self.input_widget.format_value(value)
        return format_html("<p>{}</p>", text or "")


class TaxLevelRateFormSet(BaseInlineFormSet):
    def add_fields(self, form: ModelForm, index: int | None) -> None:
        super().add_fields(form, index)

        # Payments and net prices of past days use these rates.
        rate: TaxLevelRate = form.instance
        if rate.pk is not None and rate.begins < local_date():
            begins_field = form.fields["begins"]
            begins_field.disabled = True
            begins_field.widget = ReadOnlyTextWidget(input_widget=begins_field.widget)

            percentage_field = form.fields["percentage"]
            percentage_field.disabled = True
            percentage_field.widget = ReadOnlyTextWidget(input_widget=percentage_field.widget)

            if DELETION_FIELD_NAME in form.fields:
                delete_field = form.fields[DELETION_FIELD_NAME]
                delete_field.disabled = True
                delete_field.widget = forms.HiddenInput()

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
