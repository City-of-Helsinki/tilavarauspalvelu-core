from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from applications.models import Organisation

from .forms.organization import OrganisationAdminForm

__all__ = [
    "OrganisationAdmin",
]


@admin.register(Organisation)
class OrganisationAdmin(TranslationAdmin):
    form = OrganisationAdminForm

    list_display = [
        "name",
        "identifier",
        "organisation_type",
        "active_members",
    ]
    list_filter = [
        "organisation_type",
    ]

    search_fields = [
        "name",
        "identifier",
    ]
    search_help_text = _("Search by organisation name or identifier")
