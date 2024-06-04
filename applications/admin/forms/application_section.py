from django import forms
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields import EnumChoiceField

from applications.choices import ApplicationSectionStatusChoice
from applications.models import Application, ApplicationSection
from common.fields.forms import disabled_widget

__all__ = [
    "ApplicationSectionAdminForm",
    "ApplicationSectionInlineAdminForm",
]


class ApplicationSectionAdminForm(forms.ModelForm):
    application = forms.ModelChoiceField(
        Application.objects.select_related("user"),
        label=_("Application"),
        help_text=_("Application this section is in."),
    )

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
        )
        % {
            "unallocated": ApplicationSectionStatusChoice.UNALLOCATED.label,
            "in_allocation": ApplicationSectionStatusChoice.IN_ALLOCATION.label,
            "handled": ApplicationSectionStatusChoice.HANDLED.label,
        },
    )

    def __init__(self, *args, **kwargs) -> None:
        instance: ApplicationSection | None = kwargs.get("instance", None)
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationSectionStatusChoice(instance.status).label
        super().__init__(*args, **kwargs)

    class Meta:
        model = ApplicationSection
        fields = [
            "name",
            "status",
            "num_persons",
            "reservation_min_duration",
            "reservation_max_duration",
            "reservations_begin_date",
            "reservations_end_date",
            "applied_reservations_per_week",
            "application",
            "age_group",
            "purpose",
        ]
        labels = {
            "name": _("Name"),
            "status": _("Status"),
            "num_persons": _("Number of persons"),
            "reservation_min_duration": _("Reservation minimum duration"),
            "reservation_max_duration": _("Reservation maximum duration"),
            "reservations_begin_date": _("Reservations begin date"),
            "reservations_end_date": _("Reservations end date"),
            "applied_reservations_per_week": _("Applied reservations per week"),
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
            "age_group": _("Age group for this section."),
            "purpose": _("Purpose for this section."),
        }


class ApplicationSectionInlineAdminForm(forms.ModelForm):
    status = EnumChoiceField(enum=ApplicationSectionStatusChoice, required=False, disabled=True)
    suitable_days_of_the_week = forms.CharField()

    def __init__(self, *args, **kwargs) -> None:
        instance: ApplicationSection | None = kwargs.get("instance", None)
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = instance.status
        super().__init__(*args, **kwargs)

    class Meta:
        model = ApplicationSection
        fields = [
            "status",
            "reservation_min_duration",
            "reservation_max_duration",
            "applied_reservations_per_week",
            "suitable_days_of_the_week",
        ]
        labels = {
            "status": _("Status"),
            "suitable_days_of_the_week": _("Suitable days of the week"),
            "reservation_min_duration": _("Reservation minimum duration"),
            "reservation_max_duration": _("Reservation maximum duration"),
            "applied_reservations_per_week": _("Applied reservations per week"),
        }
        help_texts = {
            "status": _("Status"),
            "suitable_days_of_the_week": _("Suitable days of the week for this section."),
            "reservation_min_duration": _("Minimum duration that should be allocated for this section."),
            "reservation_max_duration": _("Maximum duration that should be allocated for this section."),
            "applied_reservations_per_week": _("How many reservation the applicant has applied for per week."),
        }
