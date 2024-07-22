from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from applications.models import Address

from .forms.address import AddressAdminForm

__all__ = [
    "AddressAdmin",
]


@admin.register(Address)
class AddressAdmin(TranslationAdmin):
    form = AddressAdminForm

    list_display = [
        "street_address",
        "post_code",
        "city",
    ]
    list_filter = [
        "post_code",
        "city",
    ]

    search_fields = [
        "street_address",
        "post_code",
        "city",
    ]
    search_help_text = _("Search by street address, post code or city")
