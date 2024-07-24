from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from applications.models import Organisation

__all__ = [
    "OrganisationAdmin",
]


class OrganisationAdminForm(forms.ModelForm):
    class Meta:
        model = Organisation
        fields = [
            "name",
            "email",
            "identifier",
            "year_established",
            "active_members",
            "core_business",
            "organisation_type",
            "address",
        ]
        labels = {
            "name": _("Name"),
            "email": _("Email"),
            "identifier": _("Company code"),
            "year_established": _("Year established"),
            "active_members": _("Active members"),
            "core_business": _("Core business area"),
            "organisation_type": _("Organisation type"),
            "address": _("Address"),
        }
        help_texts = {
            "name": _("Name of the organisation."),
            "email": _("Email address of the organisation."),
            "identifier": _("Organisation company code."),
            "year_established": _("Year the organisation was established."),
            "active_members": _("Number of active members in the organisation."),
            "core_business": _("Organisation core business area."),
            "organisation_type": _("Organisation type."),
            "address": _("Organisation address."),
        }


@admin.register(Organisation)
class OrganisationAdmin(TranslationAdmin):
    # Functions
    search_fields = [
        "name",
        "identifier",
    ]
    search_help_text = _("Search by organisation name or identifier")

    # List
    list_display = [
        "name",
        "identifier",
        "organisation_type",
        "active_members",
    ]
    list_filter = ["organisation_type"]

    # Form
    form = OrganisationAdminForm
