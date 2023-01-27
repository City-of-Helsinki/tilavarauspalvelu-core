from datetime import datetime
from decimal import Decimal

from django import forms

from email_notification.models import EmailTemplate


class EmailTestForm(forms.Form):
    recipient = forms.CharField(
        initial="", max_length=256, widget=forms.TextInput(attrs={"size": 50})
    )
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
    unit_location = forms.CharField(
        initial="Testikatu 99999 Korvatunturi",
        widget=forms.TextInput(attrs={"size": 50}),
    )
    price = forms.DecimalField(
        decimal_places=2, initial=Decimal("12.30"), widget=forms.NumberInput()
    )
    non_subsidised_price = forms.DecimalField(
        decimal_places=2, initial=Decimal("15.00"), widget=forms.NumberInput()
    )
    subsidised_price = forms.DecimalField(
        decimal_places=2, initial=Decimal("5.00"), widget=forms.NumberInput
    )
    tax_percentage = forms.IntegerField(initial=24, widget=forms.NumberInput)
    confirmed_instructions_fi = forms.CharField(
        initial="[lisäohje: hyväksytty]", widget=forms.Textarea
    )
    confirmed_instructions_sv = forms.CharField(
        initial="[mer information: bekräftats]", widget=forms.Textarea
    )
    confirmed_instructions_en = forms.CharField(
        initial="[additional info: confirmed]", widget=forms.Textarea
    )
    pending_instructions_fi = forms.CharField(
        initial="[lisäohje: käsittelyssä]", widget=forms.Textarea
    )
    pending_instructions_sv = forms.CharField(
        initial="[mer information: kräver hantering]", widget=forms.Textarea
    )
    pending_instructions_en = forms.CharField(
        initial="[additional infor: requires handling]", widget=forms.Textarea
    )
    cancelled_instructions_fi = forms.CharField(
        initial="[lisäohje: peruttu]", widget=forms.Textarea
    )
    cancelled_instructions_sv = forms.CharField(
        initial="[mer information: avbokad]", widget=forms.Textarea
    )
    cancelled_instructions_en = forms.CharField(
        initial="[additional infor: cancelled]", widget=forms.Textarea
    )
    deny_reason_fi = forms.CharField(initial="[syy]", widget=forms.Textarea)
    deny_reason_sv = forms.CharField(initial="[orsak]", widget=forms.Textarea)
    deny_reason_en = forms.CharField(initial="[reason]", widget=forms.Textarea)
    cancel_reason_fi = forms.CharField(initial="[syy]", widget=forms.Textarea)
    cancel_reason_sv = forms.CharField(initial="[orsak]", widget=forms.Textarea)
    cancel_reason_en = forms.CharField(initial="[reason]", widget=forms.Textarea)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        # Templates are fetched here because calling EmailTemplate.objects.all() in the field
        # initialization somehow wrecks translation support. I didn't have time figure out
        # the root cause, but setting the choices here solves the issue
        template_choices = list(
            map(
                lambda template: (template.pk, template.name),
                EmailTemplate.objects.all(),
            )
        )
        self.fields["template"].choices = template_choices
