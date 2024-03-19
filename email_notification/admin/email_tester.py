import contextlib
from datetime import datetime
from decimal import Decimal
from typing import Any

from django import forms
from django.core.exceptions import ValidationError

from email_notification.helpers.email_builder_reservation import ReservationEmailBuilder
from email_notification.models import EmailTemplate
from reservation_units.models import ReservationUnit
from spaces.models import Location


def get_email_template_tester_form_initial_values(request) -> dict[str, Any]:
    recipient = request.user.email if request.user else ""
    initial_values = {"recipient": recipient}

    with contextlib.suppress(AttributeError):
        # Select the template that user navigated from
        initial_values["template"] = request.resolver_match.kwargs.get("extra_context")

    reservation_unit_pk = request.GET.get("reservation_unit", None)
    if not reservation_unit_pk:
        return initial_values

    reservation_unit: ReservationUnit = ReservationUnit.objects.filter(pk=int(reservation_unit_pk)).first()
    if not reservation_unit:
        return initial_values

    initial_values["reservation_unit_name"] = reservation_unit.name
    initial_values["unit_name"] = getattr(reservation_unit.unit, "name", "")

    location: Location | None = getattr(reservation_unit.unit, "location", None)
    if location is not None:
        initial_values["unit_location"] = str(location)

    # Set initial instructions values for all languages
    for lang in ["fi", "sv", "en"]:
        for field in ["confirmed_instructions", "pending_instructions", "cancelled_instructions"]:
            initial_values[f"{field}_{lang}"] = getattr(reservation_unit, f"reservation_{field}_{lang}", "")

    return initial_values


class EmailTemplateTesterReservationUnitSelectForm(forms.Form):
    reservation_unit = forms.ChoiceField()

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        runit_choices = [
            (runit.pk, f"{runit.name} - {runit.unit.name}")
            for runit in ReservationUnit.objects.select_related("unit").order_by("name_fi")
        ]
        self.fields["reservation_unit"].choices = runit_choices


class EmailTemplateTesterForm(forms.Form):
    recipient = forms.CharField(initial="", max_length=256, widget=forms.TextInput(attrs={"size": 50}))
    template = forms.ChoiceField()  # Choices are defined in __init__
    begin_datetime = forms.SplitDateTimeField(
        initial=datetime(2100, 1, 1, 12, 00),
        widget=forms.SplitDateTimeWidget(date_format="%d.%m.%Y", time_format="%H:%M"),
    )
    end_datetime = forms.SplitDateTimeField(
        initial=datetime(2100, 1, 1, 13, 15),
        widget=forms.SplitDateTimeWidget(date_format="%d.%m.%Y", time_format="%H:%M"),
    )
    reservation_number = forms.IntegerField(initial=1234567)
    reservee_name = forms.CharField(initial="Email Test")
    reservation_name = forms.CharField(initial="TESTIVARAUS")
    reservation_unit_name = forms.CharField(initial="VARAUSYKSIKKÖ")
    unit_name = forms.CharField(initial="TOIMIPISTE")
    unit_location = forms.CharField(initial="Testikatu 99999 Korvatunturi", widget=forms.TextInput(attrs={"size": 50}))
    price = forms.DecimalField(decimal_places=2, initial=Decimal("12.30"), widget=forms.NumberInput())
    non_subsidised_price = forms.DecimalField(decimal_places=2, initial=Decimal("15.00"), widget=forms.NumberInput())
    subsidised_price = forms.DecimalField(decimal_places=2, initial=Decimal("5.00"), widget=forms.NumberInput)
    tax_percentage = forms.IntegerField(initial=24, widget=forms.NumberInput)
    confirmed_instructions_fi = forms.CharField(initial="[lisäohje: hyväksytty]", widget=forms.Textarea)
    confirmed_instructions_sv = forms.CharField(initial="[mer information: bekräftats]", widget=forms.Textarea)
    confirmed_instructions_en = forms.CharField(initial="[additional info: confirmed]", widget=forms.Textarea)
    pending_instructions_fi = forms.CharField(initial="[lisäohje: käsittelyssä]", widget=forms.Textarea)
    pending_instructions_sv = forms.CharField(initial="[mer information: kräver hantering]", widget=forms.Textarea)
    pending_instructions_en = forms.CharField(initial="[additional infor: requires handling]", widget=forms.Textarea)
    cancelled_instructions_fi = forms.CharField(initial="[lisäohje: peruttu]", widget=forms.Textarea)
    cancelled_instructions_sv = forms.CharField(initial="[mer information: avbokad]", widget=forms.Textarea)
    cancelled_instructions_en = forms.CharField(initial="[additional infor: cancelled]", widget=forms.Textarea)
    deny_reason_fi = forms.CharField(initial="[syy]", widget=forms.Textarea)
    deny_reason_sv = forms.CharField(initial="[orsak]", widget=forms.Textarea)
    deny_reason_en = forms.CharField(initial="[reason]", widget=forms.Textarea)
    cancel_reason_fi = forms.CharField(initial="[syy]", widget=forms.Textarea)
    cancel_reason_sv = forms.CharField(initial="[orsak]", widget=forms.Textarea)
    cancel_reason_en = forms.CharField(initial="[reason]", widget=forms.Textarea)

    def clean_template(self) -> None:
        template = EmailTemplate.objects.get(pk=self.cleaned_data["template"])

        # TODO: Add support for APPLICATION-type email templates
        if template.type not in ReservationEmailBuilder.email_template_types:
            raise ValidationError("Only RESERVATION email template testing is supported.")

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        # Templates are fetched here because calling EmailTemplate.objects.all() in the field initialization breaks
        # translation support, due to the choices being defined on module import.
        template_choices = [(template.pk, template.name) for template in EmailTemplate.objects.all()]
        self.fields["template"].choices = template_choices
