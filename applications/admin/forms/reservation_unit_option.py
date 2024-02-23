from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import ReservationUnitOption
from reservation_units.models import ReservationUnit

__all__ = [
    "ReservationUnitOptionInlineAdminForm",
]


class ReservationUnitOptionInlineAdminForm(forms.ModelForm):
    reservation_unit = forms.ModelChoiceField(
        ReservationUnit.objects.select_related("unit"),
        help_text=_("Reservation unit for to this option."),
    )

    class Meta:
        model = ReservationUnitOption
        fields = [
            "preferred_order",
            "rejected",
            "locked",
            "reservation_unit",
        ]
        help_texts = {
            "preferred_order": _("Preferred order of the reservation unit option."),
            "rejected": _("Rejected reservation unit options can never receive allocations."),
            "locked": _("Locked reservation unit options can no longer receive allocations."),
        }
