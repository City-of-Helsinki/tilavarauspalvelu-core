from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy
from tinymce.widgets import TinyMCE

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.fields.forms import ModelMultipleChoiceFilteredField, disabled_widget
from reservation_units.models import ReservationUnit
from reservations.models import ReservationPurpose
from terms_of_use.models import TermsOfUse

__all__ = [
    "ApplicationRoundAdminForm",
]


class ApplicationRoundAdminForm(forms.ModelForm):
    status = forms.CharField(
        widget=disabled_widget,
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

    reservation_units = ModelMultipleChoiceFilteredField(
        queryset=ReservationUnit.objects.select_related("unit").all(),
        is_stacked=False,
        label=_("Reservation units"),
        help_text=_("Reservation units that can be applied for in this application round."),
    )

    purposes = ModelMultipleChoiceFilteredField(
        queryset=ReservationPurpose.objects.all(),
        is_stacked=False,
        label=_("Purposes"),
        help_text=_("Purposes that are allowed in this application period."),
    )

    terms_of_use = forms.ModelChoiceField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_RECURRING).all(),
        label=pgettext_lazy("ApplicationRound", "Terms of use"),
        help_text=_("Terms of use for the application round."),
    )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        instance: ApplicationRound | None = kwargs.get("instance", None)
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationRoundStatusChoice(instance.status).label
        super().__init__(*args, **kwargs)

    class Meta:
        model = ApplicationRound
        fields = [
            "name",
            "status",
            "target_group",
            "reservation_units",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "public_display_begin",
            "public_display_end",
            "handled_date",
            "sent_date",
            "purposes",
            "service_sector",
            "terms_of_use",
            "criteria",
        ]
        widgets = {
            "criteria": TinyMCE(),
        }
        labels = {
            "name": _("Name"),
            "name_fi": _("Name (Finnish)"),
            "name_en": _("Name (English)"),
            "name_sv": _("Name (Swedish)"),
            "target_group": _("Target group"),
            "reservation_units": _("Reservation units"),
            "application_period_begin": _("Application period begin date and time"),
            "application_period_end": _("Application period end date and time"),
            "reservation_period_begin": _("Reservation period begin date"),
            "reservation_period_end": _("Reservation period end date"),
            "public_display_begin": _("Public display begin date and time"),
            "public_display_end": _("Public display end date and time"),
            "handled_date": _("Handled date"),
            "sent_date": _("Sent date"),
            "purposes": _("Purposes"),
            "service_sector": _("Service sector"),
            "terms_of_use": pgettext_lazy("ApplicationRound", "Terms of use"),
            "criteria": _("Application criteria"),
            "criteria_fi": _("Application criteria (Finnish)"),
            "criteria_en": _("Application criteria (English)"),
            "criteria_sv": _("Application criteria (Swedish)"),
        }
        help_texts = {
            "name": _("Name that describes the application round."),
            "name_fi": _("Name that describes the application round in Finnish."),
            "name_en": _("Name that describes the application round in English."),
            "name_sv": _("Name that describes the application round in Swedish."),
            "target_group": _("Target group of the application round."),
            "reservation_units": _("Reservation units that can be applied for in this application round."),
            "application_period_begin": _("Start date and time of the period when application can be sent."),
            "application_period_end": _("End date and time of the period when application can be sent."),
            "reservation_period_begin": _("Start date of the period to which the reservations will be made."),
            "reservation_period_end": _("End date of the period to which the reservations will be made."),
            "public_display_begin": _("Start date and time when application round is visible to public."),
            "public_display_end": _("End date and time when application round is visible to public."),
            "handled_date": _("When the application round was handled."),
            "sent_date": _("When the application round applications were sent to applicants."),
            "purposes": _("Purposes that are allowed in this application period."),
            "service_sector": _("Service sector for the application round."),
            "terms_of_use": _("Terms of use for the application round."),
            "criteria": _("Application criteria for the application round."),
            "criteria_fi": _("Application criteria for the application round in Finnish."),
            "criteria_en": _("Application criteria for the application round in English."),
            "criteria_sv": _("Application criteria for the application round in Swedish."),
        }
