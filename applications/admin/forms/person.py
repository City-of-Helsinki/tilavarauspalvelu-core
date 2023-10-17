from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import Person

__all__ = [
    "PersonAdminForm",
]


class PersonAdminForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
        help_texts = {
            "first_name": _("Person's first name."),
            "last_name": _("Person's last name."),
            "email": _("Person's email address."),
            "phone_number": _("Person's phone number."),
        }
