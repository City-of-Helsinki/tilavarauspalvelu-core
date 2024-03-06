from django import forms
from django.utils.translation import gettext_lazy as _

from applications.choices import ApplicationStatusChoice
from applications.models import Application
from common.fields.forms import disabled_widget

__all__ = [
    "ApplicationAdminForm",
]


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

    def __init__(self, *args, **kwargs):
        instance: Application | None = kwargs.get("instance", None)
        if instance is not None:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = ApplicationStatusChoice(instance.status).label
        super().__init__(*args, **kwargs)

    class Meta:
        model = Application
        fields = [
            "applicant_type",
            "status",
            "application_round",
            "organisation",
            "contact_person",
            "user",
            "billing_address",
            "home_city",
            "additional_information",
            "working_memo",
            "sent_date",
            "cancelled_date",
        ]
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
        }
