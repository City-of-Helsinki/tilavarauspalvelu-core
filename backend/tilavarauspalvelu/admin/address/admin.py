from __future__ import annotations

from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Address


class AddressAdminForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = [
            "street_address",
            "post_code",
            "city",
        ]
        labels = {
            "street_address": _("Street address"),
            "post_code": _("Post code"),
            "city": _("City"),
        }
        help_texts = {
            "street_address": _("Street address"),
            "post_code": _("Post code"),
            "city": _("City"),
        }


@admin.register(Address)
class AddressAdmin(TranslationAdmin):
    # Functions
    search_fields = [
        "street_address",
        "post_code__iexact",
        "city",
    ]
    search_help_text = _("Search by street address, post code or city")

    # List
    list_display = [
        "street_address",
        "post_code",
        "city",
    ]
    list_filter = [
        "post_code",
        "city",
    ]

    # Form
    form = AddressAdminForm
