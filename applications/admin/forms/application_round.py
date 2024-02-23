from django import forms
from django.utils.translation import gettext_lazy as _
from tinymce.widgets import TinyMCE

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.fields.forms import EnumChoiceField, disabled_widget

__all__ = [
    "ApplicationRoundAdminForm",
]


class ApplicationRoundAdminForm(forms.ModelForm):
    status = EnumChoiceField(
        enum=ApplicationRoundStatusChoice,
        widget=disabled_widget,
        required=False,
        disabled=True,
        label=_("Status"),
        help_text=(
            f"{ApplicationRoundStatusChoice.UPCOMING.value}: "
            f"Applications cannot yet be made in the round. "
            f"{ApplicationRoundStatusChoice.OPEN.value}: "
            f"Applications can be made in the round. "
            f"{ApplicationRoundStatusChoice.IN_ALLOCATION.value}: "
            f"Applications in the round are being allocated. "
            f"{ApplicationRoundStatusChoice.HANDLED.value}: "
            f"All application have been allocated. "
            f"{ApplicationRoundStatusChoice.RESULTS_SENT.value}: "
            f"All application results have been sent to users. "
        ),
    )

    def __init__(self, *args, **kwargs):
        instance: ApplicationRound | None = kwargs.get("instance", None)
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = instance.status
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
            "criteria",
        ]
        widgets = {
            "criteria": TinyMCE(),
        }
        labels = {
            "name": _("Name"),
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
            "criteria": _("Application criteria"),
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
            "handled_date": _("When the application round was handled."),
            "sent_date": _("When the application round applications were sent to applicants."),
            "purposes": _("Purposes that are allowed in this application period."),
            "service_sector": _("Service sector for the application round."),
            "criteria": _("Application criteria for the application round."),
        }
