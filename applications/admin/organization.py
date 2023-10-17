from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from applications.models import Organisation

from .forms.organization import OrganisationAdminForm

__all__ = [
    "OrganisationAdmin",
]


@admin.register(Organisation)
class OrganisationAdmin(TranslationAdmin):
    model = OrganisationAdminForm
