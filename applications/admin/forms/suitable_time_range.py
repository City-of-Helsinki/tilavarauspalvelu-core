from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import SuitableTimeRange

__all__ = [
    "SuitableTimeRangeInlineAdminForm",
]


class SuitableTimeRangeInlineAdminForm(forms.ModelForm):
    fulfilled = forms.BooleanField(
        widget=forms.NullBooleanSelect(attrs={"class": "readonly"}),
        required=False,
        disabled=True,
        label=_("Fulfilled"),
        help_text=_(
            "Has this suitable time range been fulfilled based on existing allocations "
            "and reservation unit options being locked or rejected."
        ),
    )

    def __init__(self, *args, **kwargs) -> None:
        instance: SuitableTimeRange | None = kwargs.get("instance", None)
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["fulfilled"] = instance.fulfilled
        super().__init__(*args, **kwargs)

    class Meta:
        model = SuitableTimeRange
        fields = [
            "priority",
            "day_of_the_week",
            "begin_time",
            "end_time",
            "fulfilled",
        ]
        labels = {
            "priority": _("Priority"),
            "day_of_the_week": _("Day of the week"),
            "begin_time": _("Begin time"),
            "end_time": _("End time"),
            "fulfilled": _("Fulfilled"),
        }
        help_texts = {
            "priority": _("Priority of the time range."),
            "day_of_the_week": _("Requested day of the week."),
            "begin_time": _("Requested start time for allocations."),
            "end_time": _("Requested end time for allocations."),
            "fulfilled": _(
                "Has this suitable time range been fulfilled based on existing allocations "
                "and reservation unit options being locked or rejected."
            ),
        }
