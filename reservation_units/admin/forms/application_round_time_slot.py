from django import forms
from django.utils.translation import gettext_lazy as _
from subforms.fields import DynamicArrayField, NestedFormField

from applications.choices import WeekdayChoice
from applications.models import ApplicationRoundTimeSlot
from applications.validators import validate_string_time


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
