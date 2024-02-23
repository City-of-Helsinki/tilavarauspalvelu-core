from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import AllocatedTimeSlot, ReservationUnitOption

__all__ = [
    "AllocatedTimeSlotAdminForm",
]


class AllocatedTimeSlotAdminForm(forms.ModelForm):
    reservation_unit_option = forms.ModelChoiceField(
        ReservationUnitOption.objects.select_related("application_section", "reservation_unit__unit"),
        help_text=_("Reservation unit option for to this allocation."),
        blank=False,
    )

    class Meta:
        model = AllocatedTimeSlot
        fields = [
            "day_of_the_week",
            "begin_time",
            "end_time",
            "reservation_unit_option",
        ]
        labels = {
            "day_of_the_week": _("Day of the week"),
            "begin_time": _("Begin time"),
            "end_time": _("End time"),
            "reservation_unit_option": _("Reservation unit option"),
        }
        help_texts = {
            "day_of_the_week": _("Allocated day of the week."),
            "begin_time": _("Allocated begin time."),
            "end_time": _("Allocated end time."),
        }
