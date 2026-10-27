from __future__ import annotations

from typing import Any

from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import ApplicationRound, ReservationUnit
from tilavarauspalvelu.services.pricing.application_round_options import check_application_round_change


class ApplicationRoundAdminForm(forms.ModelForm):
    status = forms.CharField(
        widget=forms.TextInput(attrs={"class": "readonly", "disabled": True, "required": False}),
        required=False,
        disabled=True,
        label=_("Status"),
        help_text=_(
            "%(upcoming)s: Applications cannot yet be made in the round. <br>"
            "%(open)s: Applications can be made in the round. <br>"
            "%(in_allocation)s: Applications in the round are being allocated. <br>"
            "%(handled)s: All application have been allocated. <br>"
            "%(results_sent)s: All application results have been sent to users. <br>"
        )
        % {
            "upcoming": ApplicationRoundStatusChoice.UPCOMING.label,
            "open": ApplicationRoundStatusChoice.OPEN.label,
            "in_allocation": ApplicationRoundStatusChoice.IN_ALLOCATION.label,
            "handled": ApplicationRoundStatusChoice.HANDLED.label,
            "results_sent": ApplicationRoundStatusChoice.RESULTS_SENT.label,
        },
    )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        instance: ApplicationRound | None = kwargs.get("instance")
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationRoundStatusChoice(instance.status).label
        self.base_fields["reservation_units"].queryset = ReservationUnit.objects.select_related("unit").all()
        self.base_fields["terms_of_use"].required = True
        super().__init__(*args, **kwargs)

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()

        price_option_fields = {"reservation_units", "reservation_period_begin_date", "reservation_period_end_date"}
        if self.instance.pk is not None and not price_option_fields.intersection(self.changed_data):
            return cleaned_data

        reservation_units = cleaned_data.get("reservation_units")
        period_begin = cleaned_data.get("reservation_period_begin_date")
        period_end = cleaned_data.get("reservation_period_end_date")
        if reservation_units is None or period_begin is None or period_end is None:
            return cleaned_data

        errors = check_application_round_change(
            application_round_pk=self.instance.pk,
            reservation_unit_pks=[reservation_unit.pk for reservation_unit in reservation_units],
            period_begin=period_begin,
            period_end=period_end,
        )
        if errors:
            raise ValidationError([error.message for error in errors])

        return cleaned_data

    class Meta:
        model = ApplicationRound
        fields = []  # Use fields from ModelAdmin
        widgets = {
            "criteria": TinyMCE(),
            "notes_when_applying": TinyMCE(),
        }
        labels = {
            "name": _("Name"),
            "name_fi": _("Name (Finnish)"),
            "name_en": _("Name (English)"),
            "name_sv": _("Name (Swedish)"),
            "reservation_units": _("Reservation units"),
            "application_period_begins_at": _("Application period begin date and time"),
            "application_period_ends_at": _("Application period end date and time"),
            "reservation_period_begin_date": _("Reservation period begin date"),
            "reservation_period_end_date": _("Reservation period end date"),
            "public_display_begins_at": _("Public display begin date and time"),
            "public_display_ends_at": _("Public display end date and time"),
            "handled_at": _("Handled date"),
            "sent_at": _("Sent date"),
            "purposes": _("IntendedUses"),
            "terms_of_use": pgettext_lazy("ApplicationRound", "Terms of use"),
            "criteria": _("Application criteria"),
            "criteria_fi": _("Application criteria (Finnish)"),
            "criteria_en": _("Application criteria (English)"),
            "criteria_sv": _("Application criteria (Swedish)"),
            "notes_when_applying": _("Notes when applying"),
            "notes_when_applying_fi": _("Notes when applying (Finnish)"),
            "notes_when_applying_en": _("Notes when applying (English)"),
            "notes_when_applying_sv": _("Notes when applying (Swedish)"),
        }
        help_texts = {
            "name": _("Name that describes the application round."),
            "name_fi": _("Name that describes the application round in Finnish."),
            "name_en": _("Name that describes the application round in English."),
            "name_sv": _("Name that describes the application round in Swedish."),
            "reservation_units": _("Reservation units that can be applied for in this application round."),
            "application_period_begins_at": _("Start date and time of the period when application can be sent."),
            "application_period_ends_at": _("End date and time of the period when application can be sent."),
            "reservation_period_begin_date": _("Start date of the period to which the reservations will be made."),
            "reservation_period_end_date": _("End date of the period to which the reservations will be made."),
            "public_display_begins_at": _("Start date and time when application round is visible to public."),
            "public_display_ends_at": _("End date and time when application round is visible to public."),
            "handled_at": _("When the application round was handled."),
            "sent_at": _("When the application round applications were sent to applicants."),
            "purposes": _("IntendedUses that are allowed in this application period."),
            "terms_of_use": _("Terms of use for the application round."),
            "criteria": _("Application criteria for the application round."),
            "criteria_fi": _("Application criteria for the application round in Finnish."),
            "criteria_en": _("Application criteria for the application round in English."),
            "criteria_sv": _("Application criteria for the application round in Swedish."),
            "notes_when_applying": _("Text to show to applicants while they fill out their application."),
            "notes_when_applying_fi": _("Text to show to applicants while they fill out their application."),
            "notes_when_applying_en": _("Text to show to applicants while they fill out their application."),
            "notes_when_applying_sv": _("Text to show to applicants while they fill out their application."),
        }
