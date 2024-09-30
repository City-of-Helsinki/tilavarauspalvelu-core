from django import forms
from django.utils.translation import gettext_lazy as _

from applications.enums import ApplicationSectionStatusChoice
from applications.models import Application, ApplicationSection, ReservationUnitOption, SuitableTimeRange
from common.fields.forms import disabled_widget
from reservation_units.models import ReservationUnit


class ReservationUnitOptionInlineAdminForm(forms.ModelForm):
    reservation_unit = forms.ModelChoiceField(
        ReservationUnit.objects.select_related("unit"),
        label=_("Reservation unit"),
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
        labels = {
            "preferred_order": _("Preferred order"),
            "rejected": _("Rejected"),
            "locked": _("Locked"),
            "reservation_unit": _("Reservation unit"),
        }
        help_texts = {
            "preferred_order": _("Preferred order of the reservation unit option."),
            "rejected": _("Rejected reservation unit options can never receive allocations."),
            "locked": _("Locked reservation unit options can no longer receive allocations."),
            "reservation_unit": _("Reservation unit for to this option."),
        }


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
        instance: SuitableTimeRange | None = kwargs.get("instance")
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


class ApplicationSectionAdminForm(forms.ModelForm):
    status = forms.CharField(
        widget=disabled_widget,
        required=False,
        disabled=True,
        label=_("Status"),
        help_text=_(
            "%(unallocated)s: Section has been created, but application round is still open. <br>"
            "%(in_allocation)s: Application round has closed, but the section is not fully allocated. <br>"
            "%(handled)s: Application round is no longer in allocation, section's applied reservations "
            "per week has been fulfilled, or all reservation unit options rejected or locked. <br>"
            "%(rejected)s: All applied slots for this application section have been locked or rejected. <br>"
        )
        % {
            "unallocated": ApplicationSectionStatusChoice.UNALLOCATED.label,
            "in_allocation": ApplicationSectionStatusChoice.IN_ALLOCATION.label,
            "handled": ApplicationSectionStatusChoice.HANDLED.label,
            "rejected": ApplicationSectionStatusChoice.REJECTED.label,
        },
    )

    def __init__(self, *args, **kwargs) -> None:
        instance: ApplicationSection | None = kwargs.get("instance")
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationSectionStatusChoice(instance.status).label
        self.base_fields["application"].queryset = Application.objects.select_related("user")
        super().__init__(*args, **kwargs)

    class Meta:
        model = ApplicationSection
        fields = []  # Use fields from ModelAdmin
        labels = {
            "name": _("Name"),
            "status": _("Status"),
            "num_persons": _("Number of persons"),
            "reservation_min_duration": _("Reservation minimum duration"),
            "reservation_max_duration": _("Reservation maximum duration"),
            "reservations_begin_date": _("Reservations begin date"),
            "reservations_end_date": _("Reservations end date"),
            "applied_reservations_per_week": _("Applied reservations per week"),
            "application": _("Application"),
            "age_group": _("Age group"),
            "purpose": _("Purpose"),
        }
        help_texts = {
            "name": _("Name that describes this section."),
            "num_persons": _("Number of persons that are excepted to attend this section."),
            "reservation_min_duration": _("Minimum duration that should be allocated for this section."),
            "reservation_max_duration": _("Maximum duration that should be allocated for this section."),
            "reservations_begin_date": _("First date on which reservations for this section are created."),
            "reservations_end_date": _("Last date on which reservations for this section are created."),
            "applied_reservations_per_week": _("How many reservation the applicant has applied for per week."),
            "application": _("Application this section is in."),
            "age_group": _("Age group for this section."),
            "purpose": _("Purpose for this section."),
        }
