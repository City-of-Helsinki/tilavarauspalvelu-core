from __future__ import annotations

from typing import TYPE_CHECKING, Any, Self

from django import forms
from subforms.fields import DynamicArrayField, NestedFormField

from tilavarauspalvelu.admin.email_template.utils import get_mock_params
from tilavarauspalvelu.enums import AccessType, Language
from tilavarauspalvelu.translation import get_attr_by_language

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.email.typing import EmailTemplateType
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "EmailTesterForm",
]


class EmailTesterForm(forms.BaseForm):
    email_type: EmailTemplateType

    def __init__(self, email_type: EmailTemplateType, **kwargs: Any) -> None:
        self.email_type = email_type

        email_tester_fields = get_email_tester_form_fields()

        # Select only the fields required for the email type
        form_fields = {field: email_tester_fields[field] for field in self.email_type.context_variables}
        self.base_fields = {
            "send_to": forms.EmailField(widget=email_widget),
            "language": forms.ChoiceField(initial=Language.FI.value, choices=Language.choices),
            **form_fields,
        }

        super().__init__(**kwargs)

    def to_context(self) -> EmailContext:
        """Return the correct EmailContext based on the email type from the form data."""
        context_params = {field: self.cleaned_data[field] for field in self.email_type.context_variables}
        # Language is always needed
        context_params["language"] = self.cleaned_data["language"]
        return self.email_type.get_email_context(**context_params)

    @classmethod
    def from_reservation_unit(cls, email_type: EmailTemplateType, instance: ReservationUnit, *, language: Lang) -> Self:
        """Initialise the form with data form from reservation unit information."""
        initial: dict[str, Any] = {
            "reservation_unit_name": get_attr_by_language(instance, "name", language),
            "unit_name": get_attr_by_language(instance.unit, "name", language),
            "unit_location": instance.actions.get_address(),
            "instructions_confirmed": get_attr_by_language(instance, "reservation_confirmed_instructions", language),
            "instructions_cancelled": get_attr_by_language(instance, "reservation_cancelled_instructions", language),
            "instructions_pending": get_attr_by_language(instance, "reservation_pending_instructions", language),
        }
        if instance.current_access_type != AccessType.ACCESS_CODE:
            initial.update({
                "access_code_is_used": False,
                "access_code": "",
                "access_code_validity_period": "",
            })

        return cls(email_type=email_type, initial=initial)


WIDTH = 50

text_widget = forms.TextInput(attrs={"size": WIDTH})
email_widget = forms.EmailInput(attrs={"size": WIDTH})
url_widget = forms.URLInput(attrs={"size": WIDTH})
text_area_widget = forms.Textarea(attrs={"size": WIDTH})
datetime_widget = forms.SplitDateTimeWidget(date_format="%d.%m.%Y", time_format="%H:%M")
date_widget = forms.DateInput(attrs={"size": WIDTH})
number_widget = forms.NumberInput(attrs={"size": WIDTH})


class AllocationForm(forms.Form):
    weekday_value = forms.CharField(widget=text_widget)
    time_value = forms.CharField(widget=text_widget)
    access_code_validity_period = forms.CharField(widget=text_widget)
    series_url = forms.URLField(widget=url_widget)


def get_email_tester_form_fields() -> dict[str, Any]:
    initial = get_mock_params(language="fi", access_code_is_used=True)

    return {
        "email_recipient_name": forms.CharField(initial=initial["email_recipient_name"], widget=text_widget),
        "reservee_name": forms.CharField(initial=initial["reservee_name"], widget=text_widget),
        "reservation_name": forms.CharField(initial=initial["reservation_name"], widget=text_widget),
        "cancel_reason": forms.CharField(initial=initial["cancel_reason"], widget=text_widget),
        "rejection_reason": forms.CharField(initial=initial["rejection_reason"], widget=text_widget),
        "reservation_unit_name": forms.CharField(initial=initial["reservation_unit_name"], widget=text_widget),
        "unit_name": forms.CharField(initial=initial["unit_name"], widget=text_widget),
        "unit_location": forms.CharField(initial=initial["unit_location"], widget=text_widget),
        "begin_datetime": forms.SplitDateTimeField(initial=initial["begin_datetime"], widget=datetime_widget),
        "end_datetime": forms.SplitDateTimeField(initial=initial["end_datetime"], widget=datetime_widget),
        "price": forms.DecimalField(initial=initial["price"], widget=number_widget),
        "subsidised_price": forms.DecimalField(initial=initial["subsidised_price"], widget=number_widget),
        "non_subsidised_price": forms.DecimalField(initial=initial["non_subsidised_price"], widget=number_widget),
        "applying_for_free_of_charge": forms.BooleanField(initial=initial["applying_for_free_of_charge"]),
        "payment_due_date": forms.DateField(initial=initial["payment_due_date"], widget=date_widget),
        "tax_percentage": forms.DecimalField(initial=initial["tax_percentage"], widget=number_widget),
        "reservation_id": forms.IntegerField(initial=initial["reservation_id"], widget=number_widget),
        "application_id": forms.IntegerField(initial=initial["application_id"], widget=number_widget),
        "application_section_id": forms.IntegerField(initial=initial["application_section_id"], widget=number_widget),
        "instructions_confirmed": forms.CharField(initial=initial["instructions_confirmed"], widget=text_area_widget),
        "instructions_cancelled": forms.CharField(initial=initial["instructions_cancelled"], widget=text_area_widget),
        "instructions_pending": forms.CharField(initial=initial["instructions_pending"], widget=text_area_widget),
        "weekday_value": forms.CharField(initial=initial["weekday_value"], widget=text_widget),
        "time_value": forms.CharField(initial=initial["time_value"], widget=text_widget),
        "application_section_name": forms.CharField(initial=initial["application_section_name"], widget=text_widget),
        "application_round_name": forms.CharField(initial=initial["application_round_name"], widget=text_widget),
        "access_code_is_used": forms.BooleanField(initial=initial["access_code_is_used"]),
        "access_code": forms.CharField(initial=initial["access_code"], widget=text_widget),
        "access_code_validity_period": forms.CharField(
            initial=initial["access_code_validity_period"], widget=text_widget
        ),
        "allocations": DynamicArrayField(NestedFormField(AllocationForm), initial=initial["allocations"]),
    }
