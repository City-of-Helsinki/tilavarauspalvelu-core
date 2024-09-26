from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import Person


class PersonAdminForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
        labels = {
            "first_name": _("First name"),
            "last_name": _("Last name"),
            "email": _("Email"),
            "phone_number": _("Phone number"),
        }
        help_texts = {
            "first_name": _("Person's first name."),
            "last_name": _("Person's last name."),
            "email": _("Person's email address."),
            "phone_number": _("Person's phone number."),
        }


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "first_name",
        "last_name",
    ]
    search_help_text = _("Search by first name or last name.")

    # List
    list_display = [
        "first_name",
        "last_name",
    ]

    # Form
    form = PersonAdminForm
