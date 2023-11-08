from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from subforms.fields import DynamicArrayField, NestedFormField
from tinymce.widgets import TinyMCE

from applications.choices import WeekdayChoice
from applications.models import ApplicationRoundTimeSlot
from applications.validators import validate_string_time
from reservation_units.models import ReservationUnit
from terms_of_use.models import TermsOfUse

__all__ = [
    "ReservationUnitAdminForm",
]


class ReservationUnitAdminForm(forms.ModelForm):
    description = forms.CharField(widget=TinyMCE())
    terms_of_use = forms.CharField(widget=TinyMCE(), required=False)
    pricing_terms = forms.ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)
    payment_terms = forms.ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)
    cancellation_terms = forms.ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)
    service_specific_terms = forms.ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)

    class Meta:
        model = ReservationUnit
        fields = [
            "sku",
            "name",
            "name_fi",
            "name_en",
            "name_sv",
            "description",
            "description_fi",
            "description_en",
            "description_sv",
            "spaces",
            "keyword_groups",
            "resources",
            "services",
            "purposes",
            "qualifiers",
            "reservation_unit_type",
            "require_introduction",
            "equipments",
            "terms_of_use",
            "terms_of_use_fi",
            "terms_of_use_en",
            "terms_of_use_sv",
            "payment_terms",
            "cancellation_terms",
            "service_specific_terms",
            "pricing_terms",
            "reservation_pending_instructions",
            "reservation_pending_instructions_fi",
            "reservation_pending_instructions_en",
            "reservation_pending_instructions_sv",
            "reservation_confirmed_instructions",
            "reservation_confirmed_instructions_fi",
            "reservation_confirmed_instructions_en",
            "reservation_confirmed_instructions_sv",
            "reservation_cancelled_instructions",
            "reservation_cancelled_instructions_fi",
            "reservation_cancelled_instructions_en",
            "reservation_cancelled_instructions_sv",
            "unit",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "max_persons",
            "min_persons",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "hauki_resource_id",
            "cancellation_rule",
            "reservation_start_interval",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "metadata_set",
            "max_reservations_per_user",
            "require_reservation_handling",
            "authentication",
            "reservation_kind",
            "payment_types",
            "can_apply_free_of_charge",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "payment_merchant",
            "payment_accounting",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["pricing_terms"].queryset = TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PRICING)
        self.fields["payment_terms"].queryset = TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)
        self.fields["cancellation_terms"].queryset = TermsOfUse.objects.filter(
            terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        )
        self.fields["service_specific_terms"].queryset = TermsOfUse.objects.filter(
            terms_type=TermsOfUse.TERMS_TYPE_SERVICE
        )

    def clean_pricing_terms(self):
        terms = self.cleaned_data.get("pricing_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_PRICING:
            raise ValidationError("Selected value for pricing terms is not valid.")

        return terms

    def clean_payment_terms(self):
        terms = self.cleaned_data.get("payment_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_PAYMENT:
            raise ValidationError("Selected value for payment terms is not valid.")

        return terms

    def clean_cancellation_terms(self):
        terms = self.cleaned_data.get("cancellation_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_CANCELLATION:
            raise ValidationError("Selected value for cancellation terms is not valid.")

        return terms

    def clean_service_specific_terms(self):
        terms = self.cleaned_data.get("service_specific_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_SERVICE:
            raise ValidationError("Selected value for service specific terms is not valid.")

        return terms


class TimeslotForm(forms.Form):
    begin = forms.CharField(validators=[validate_string_time], required=False)
    end = forms.CharField(validators=[validate_string_time], required=False)


def remove_empty_timeslots(timeslots: list[dict[str, str]]) -> None:
    # Iterate in reverse order so that items can be deleted without affecting the loop
    for i, timeslot in enumerate(reversed(timeslots)):
        if timeslot == {"begin": "", "end": ""}:
            del timeslots[i]


class ApplicationRoundTimeSlotForm(forms.ModelForm):
    weekday = forms.ChoiceField(
        choices=WeekdayChoice.choices,
        help_text=_("Which weekday this timeslot concerns."),
    )
    reservable_times = DynamicArrayField(
        subfield=NestedFormField(subform=TimeslotForm),
        help_text=_("Timeslots when the reservation unit is reservable"),
        validators=[remove_empty_timeslots],
    )

    class Meta:
        model = ApplicationRoundTimeSlot
        fields = [
            "weekday",
            "reservable_times",
            "closed",
        ]
        help_texts = {
            "closed": _("Is the reservation unit closed on this weekday?"),
        }
