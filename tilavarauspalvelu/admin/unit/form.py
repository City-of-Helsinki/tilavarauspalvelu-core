from __future__ import annotations

from django import forms
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import Unit


class UnitAdminForm(forms.ModelForm):
    class Meta:
        model = Unit
        fields = []  # Use fields from ModelAdmin
        labels = {
            "name": _("Name"),
            "description": _("Description"),
            "short_description": _("Short description"),
            "web_page": _("Web page"),
            "email": _("Email"),
            "phone": _("Phone"),
            "tprek_id": _("TPRek ID"),
            "tprek_department_id": _("TPRek department ID"),
            "tprek_last_modified": _("TPRek last modified"),
            "origin_hauki_resource": _("Hauki resource"),
            "payment_merchant": _("Payment merchant"),
            "payment_accounting": _("Payment accounting"),
            "allow_permissions_from_ad_groups": _("Allow permissions from AD groups"),
        }
        help_texts = {
            "email": _("Unit contact email"),
            "phone": _("Unit contact phone number"),
            "allow_permissions_from_ad_groups": _(
                "Should users be allowed to perform actions for this unit "
                "based on roles they have received automatically from AD groups?"
            ),
        }
