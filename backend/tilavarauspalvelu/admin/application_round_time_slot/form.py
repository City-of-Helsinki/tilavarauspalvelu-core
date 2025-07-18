from __future__ import annotations

from django import forms
from django.utils.translation import gettext_lazy as _
from subforms.fields import DynamicArrayField, NestedFormField

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.validators import validate_string_time


def remove_empty_timeslots(timeslots: list[dict[str, str]]) -> None:
    empty_timeslot = {"begin": "", "end": ""}

    while empty_timeslot in timeslots:
        timeslots.remove(empty_timeslot)


class TimeslotForm(forms.Form):
    begin = forms.CharField(validators=[validate_string_time], required=False)
    end = forms.CharField(validators=[validate_string_time], required=False)


class ApplicationRoundTimeSlotForm(forms.ModelForm):
    weekday = forms.ChoiceField(
        choices=Weekday.choices,
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
            "is_closed",
        ]
        help_texts = {
            "is_closed": _("Is the reservation unit closed on this weekday?"),
        }
