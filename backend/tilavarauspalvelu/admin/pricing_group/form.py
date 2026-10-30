from __future__ import annotations

from typing import TYPE_CHECKING

from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet, inlineformset_factory
from modeltranslation.admin import TranslationStackedInline
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.models import PriceComponent, PricingGroup, ReservationUnitPricingGroup
from tilavarauspalvelu.services.pricing.coverage import check_pricing_group_coverage
from utils.utils import only_django_validation_errors

if TYPE_CHECKING:
    import datetime

__all__ = [
    "PriceComponentInline",
    "ReservationUnitPricingGroupInline",
]


RESERVATION_UNITS_PREFIX = "reservation_unit_pricing_groups"


class PriceComponentForm(forms.ModelForm):
    instance: PriceComponent

    class Meta:
        model = PriceComponent
        fields = []  # Use fields from Inline
        widgets = {
            "material_price_description": TinyMCE(mce_attrs={"height": "150px"}),
        }


class PriceComponentFormSet(BaseInlineFormSet):
    """Check the coverage of the whole pricing group, with the reservation unit rows of the same form."""

    form = PriceComponentForm
    instance: PricingGroup

    def clean(self) -> None:
        super().clean()
        if any(self.errors):
            return

        components: list[PriceComponent] = []
        for form in self.forms:
            if not form.cleaned_data or self._should_delete_form(form):
                continue

            component = form.instance
            with only_django_validation_errors():
                component.validators.validate_option_belongs_to_pricing_group_unit_group()
                if component.pk is None or "price_option" in form.changed_data:
                    component.validators.validate_option_is_active()

            components.append(component)

        reservation_unit_begin_dates = self._reservation_unit_begin_dates()
        errors = check_pricing_group_coverage(
            components=components,
            reservation_unit_begin_dates=reservation_unit_begin_dates,
        )
        if errors:
            raise ValidationError([error.message for error in errors])

    def _reservation_unit_begin_dates(self) -> list[datetime.date]:
        reservation_unit_formset = ReservationUnitPricingGroupDataFormSet(
            data=self.data,
            instance=self.instance,
            prefix=RESERVATION_UNITS_PREFIX,
        )
        if not reservation_unit_formset.is_valid():
            return list(self.instance.reservation_unit_pricing_groups.values_list("begins", flat=True))

        return [
            form.cleaned_data["begins"]
            for form in reservation_unit_formset.forms
            if form.cleaned_data and not reservation_unit_formset._should_delete_form(form)  # noqa: SLF001
        ]


class PriceComponentInline(TranslationStackedInline):
    model = PriceComponent
    fields = [
        "kind",
        "valid_from",
        "valid_until",
        "price_option",
        "amount",
        "price_unit",
        "payment_type",
        "tax_level",
        "can_apply_for_discount",
        "material_price_description",
    ]
    form = PriceComponentForm
    formset = PriceComponentFormSet
    extra = 0


class ReservationUnitPricingGroupFormSet(BaseInlineFormSet):
    instance: PricingGroup

    def clean(self) -> None:
        super().clean()
        if any(self.errors):
            return

        reservation_unit_ids = [
            form.cleaned_data["reservation_unit"].pk
            for form in self.forms
            if form.cleaned_data and not self._should_delete_form(form)
        ]
        with only_django_validation_errors():
            self.instance.validators.validate_own_group_has_one_reservation_unit(reservation_unit_ids)


ReservationUnitPricingGroupDataFormSet = inlineformset_factory(
    parent_model=PricingGroup,
    model=ReservationUnitPricingGroup,
    fields=["reservation_unit", "begins"],
    extra=0,
)


class ReservationUnitPricingGroupInline(admin.TabularInline):
    model = ReservationUnitPricingGroup
    fields = [
        "reservation_unit",
        "begins",
    ]
    formset = ReservationUnitPricingGroupFormSet
    autocomplete_fields = ["reservation_unit"]
    extra = 0
