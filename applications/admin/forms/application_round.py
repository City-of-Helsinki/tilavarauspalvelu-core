from django import forms
from django.utils.translation import gettext_lazy as _
from tinymce.widgets import TinyMCE

from applications.models import ApplicationRound

__all__ = [
    "ApplicationRoundAdminForm",
]


class ApplicationRoundAdminForm(forms.ModelForm):
    class Meta:
        model = ApplicationRound
        fields = [
            "name",
            "target_group",
            "reservation_units",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "public_display_begin",
            "public_display_end",
            "purposes",
            "service_sector",
            "criteria",
        ]
        widgets = {
            "criteria": TinyMCE(),
        }
        help_texts = {
            "name": _("Name that describes the application round."),
            "target_group": _("Target group of the application round."),
            "reservation_units": _("Reservation units that can be applied for in this application round."),
            "application_period_begin": _("Start date and time of the period when application can be sent."),
            "application_period_end": _("End date and time of the period when application can be sent."),
            "reservation_period_begin": _("Start date of the period to which the reservations will be made."),
            "reservation_period_end": _("End date of the period to which the reservations will be made."),
            "public_display_begin": _("Start date and time when application round is visible to public."),
            "public_display_end": _("End date and time when application round is visible to public."),
            "purposes": _("Purposes that are allowed in this application period."),
            "service_sector": _("Service sector for the application round."),
            "criteria": _("Application criteria for the application round."),
        }
