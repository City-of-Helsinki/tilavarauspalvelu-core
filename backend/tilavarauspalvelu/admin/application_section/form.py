from __future__ import annotations

import json
from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import ApplicationFormType, ApplicationSectionStatusChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange
from utils.external_service.errors import ExternalServiceError


class ReservationUnitOptionInlineAdminForm(forms.ModelForm):
    class Meta:
        model = ReservationUnitOption
        fields = [
            "preferred_order",
            "is_rejected",
            "is_locked",
            "reservation_unit",
        ]
        labels = {
            "preferred_order": _("Preferred order"),
            "is_rejected": _("Rejected"),
            "is_locked": _("Locked"),
            "reservation_unit": _("Reservation unit"),
        }
        help_texts = {
            "preferred_order": _("Preferred order of the reservation unit option."),
            "is_rejected": _("Rejected reservation unit options can never receive allocations."),
            "is_locked": _("Locked reservation unit options can no longer receive allocations."),
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

    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
    instance: ApplicationSection | None

    status = forms.CharField(
        widget=forms.TextInput(attrs={"class": "readonly", "disabled": True, "required": False}),
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

    pindora_response = forms.CharField(
        widget=forms.Textarea(attrs={"disabled": True, "cols": "40", "rows": "1"}),
        required=False,
        label=_("Pindora API response"),
        help_text=_("Response from Pindora API"),
    )

    class Meta:
        model = ApplicationSection
        fields: list[str] = []  # Use fields from ModelAdmin
        labels = {
            "ext_uuid": _("External UUID"),
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
            "sport": _("Sport"),
            "sport_other": _("Other sport"),
            "participant_gender": _("Participant gender"),
            "league_level": _("League level"),
            "multiple_reservations_per_day_wish": _("Wish for multiple reservations per day"),
            "should_have_active_access_code": _("Should have active door code"),
        }
        help_texts = {
            "ext_uuid": _("ID for external systems to use"),
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
            "sport": _("Sport for this section."),
            "sport_other": _("Sport given by the applicant when the sport is not in the list."),
            "participant_gender": _("Gender of the participants, e.g. for dressing rooms."),
            "league_level": _("League level of the group."),
            "multiple_reservations_per_day_wish": _("The applicant's wish for more than one reservation per day."),
            "should_have_active_access_code": _("Should this application section have an active door code?"),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        instance: ApplicationSection | None = kwargs.get("instance")
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationSectionStatusChoice(instance.status).label

        super().__init__(*args, **kwargs)

        editing = getattr(self.instance, "pk", None) is not None

        if editing and self.instance.should_have_active_access_code:
            pindora_field = self.fields["pindora_response"]
            pindora_field.widget.attrs.update({"cols": "100", "rows": "20"})
            pindora_field.initial = self.get_pindora_response()

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()

        if self.instance.pk is not None:
            self.validate_sports_data(cleaned_data)

        return cleaned_data

    def validate_sports_data(self, cleaned_data: dict[str, Any]) -> None:
        has_sport = cleaned_data.get("sport") is not None
        has_sport_other = bool(cleaned_data.get("sport_other", "").strip())

        has_sports_data = (
            has_sport
            or has_sport_other
            or cleaned_data.get("participant_gender") is not None
            or bool(cleaned_data.get("league_level", "").strip())
            or bool(cleaned_data.get("multiple_reservations_per_day_wish", "").strip())
        )
        if not has_sports_data:
            return

        application_form = self.instance.application.application_round.application_form
        if application_form != ApplicationFormType.SPORTS_FORM:
            msg = _("Sports data can only be given when the application round uses the sports application form.")
            self.add_error(None, msg)
            return

        if has_sport and has_sport_other:
            msg = _("Application section cannot have both a sport and an other sport set.")
            self.add_error("sport_other", msg)

    def get_pindora_response(self) -> str | None:
        try:
            response = PindoraService.get_access_code(obj=self.instance)
        except ExternalServiceError as error:
            return str(error)

        return json.dumps(response._asdict(), default=str, indent=2)
