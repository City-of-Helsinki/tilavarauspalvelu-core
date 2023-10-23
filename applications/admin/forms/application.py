from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import Application

__all__ = [
    "ApplicationAdminForm",
]


class ApplicationAdminForm(forms.ModelForm):
    class Meta:
        model = Application
        fields = [
            "applicant_type",
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
