from django import forms
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields import EnumChoiceField

from applications.enums import ApplicationSectionStatusChoice, ApplicationStatusChoice
from applications.models import Application, ApplicationSection
from common.fields.forms import disabled_widget


class ApplicationSectionInlineAdminForm(forms.ModelForm):
    status = EnumChoiceField(enum=ApplicationSectionStatusChoice, required=False, disabled=True)
    suitable_days_of_the_week = forms.CharField()

    def __init__(self, *args, **kwargs) -> None:
        instance: ApplicationSection | None = kwargs.get("instance")
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


class ApplicationAdminForm(forms.ModelForm):
    status = forms.CharField(
        widget=disabled_widget,
        required=False,
        disabled=True,
        label=_("Status"),
        help_text=_(
            "%(draft)s: Application started but not ready. <br>"
            "%(received)s: Application sent by user. <br>"
            "%(in_allocation)s: Application's sections are being allocated. <br>"
            "%(handled)s: Application's sections have all been allocated. <br>"
            "%(results_sent)s: Application's results have been sent to user. <br>"
            "%(expired)s: Application not completed before application round ended. <br>"
            "%(cancelled)s: Application cancelled by user. <br>"
        )
        % {
            "draft": ApplicationStatusChoice.DRAFT.label,
            "received": ApplicationStatusChoice.RECEIVED.label,
            "in_allocation": ApplicationStatusChoice.IN_ALLOCATION.label,
            "handled": ApplicationStatusChoice.HANDLED.label,
            "results_sent": ApplicationStatusChoice.RESULTS_SENT.label,
            "expired": ApplicationStatusChoice.EXPIRED.label,
            "cancelled": ApplicationStatusChoice.CANCELLED.label,
        },
    )

    def __init__(self, *args, **kwargs) -> None:
        instance: Application | None = kwargs.get("instance")
        if instance is not None:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationStatusChoice(instance.status).label
        super().__init__(*args, **kwargs)

    class Meta:
        model = Application
        fields = []  # Use fields from ModelAdmin
        labels = {
            "applicant_type": _("Applicant type"),
            "application_round": _("Application round"),
            "organisation": _("Organisation"),
            "contact_person": _("Contact person"),
            "user": _("Applicant"),
            "billing_address": _("Billing address"),
            "home_city": _("Home city"),
            "additional_information": _("Additional information"),
            "working_memo": _("Working memo"),
            "sent_date": _("Sent date"),
            "cancelled_date": _("Cancelled date"),
            "in_allocation_notification_sent_date": _("In allocation notification sent date"),
            "results_ready_notification_sent_date": _("Results ready notification sent date"),
        }
        help_texts = {
            "applicant_type": _("Applicant type."),
            "application_round": _("Application round the application is in."),
            "organisation": _("Organisation the application is for."),
            "contact_person": _("Contact person for the application."),
            "user": _("Applicant for the application."),
            "billing_address": _("Billing address for the application."),
            "home_city": _("Home city for the application."),
            "additional_information": _("Additional information for the application."),
            "working_memo": _("Working memo for staff users."),
            "sent_date": _("Date when the application was sent."),
            "cancelled_date": _("Date when the application was cancelled."),
            "in_allocation_notification_sent_date": _(
                "Date when the applicant was notified that this application round is now in allocation."
            ),
            "results_ready_notification_sent_date": _(
                "Date when the applicant was notified that this application round results are now ready."
            ),
        }
