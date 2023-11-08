from django import forms
from django.utils.translation import gettext_lazy as _

from applications.choices import ApplicationStatusChoice
from applications.models import Application
from common.fields.forms import EnumChoiceField, disabled_widget

__all__ = [
    "ApplicationAdminForm",
]


class ApplicationAdminForm(forms.ModelForm):
    status = EnumChoiceField(
        enum=ApplicationStatusChoice,
        widget=disabled_widget,
        required=False,
        disabled=True,
        help_text=(
            f"{ApplicationStatusChoice.DRAFT.value}: "
            f"Application started but not ready. "
            f"{ApplicationStatusChoice.RECEIVED.value}: "
            f"Application sent by user. "
            f"{ApplicationStatusChoice.IN_ALLOCATION.value}: "
            f"Application's events are being allocated. "
            f"{ApplicationStatusChoice.HANDLED.value}: "
            f"Application's events have all been allocated. "
            f"{ApplicationStatusChoice.RESULTS_SENT.value}: "
            f"Application's results have been sent to user. "
            f"{ApplicationStatusChoice.EXPIRED.value}: "
            f"Application not completed before application round ended. "
            f"{ApplicationStatusChoice.CANCELLED.value}: "
            f"Application cancelled by user. "
        ),
    )

    def __init__(self, *args, **kwargs):
        instance = kwargs.get("instance", None)
        if instance:
            kwargs.setdefault("initial", {})
            kwargs["initial"]["status"] = instance.status
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
            "user": _("Applicant"),
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
