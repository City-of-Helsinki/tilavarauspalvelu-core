from __future__ import annotations

from django import forms
from django.forms.widgets import Textarea
from django.utils.translation import gettext_lazy as _
from subforms.fields import DynamicArrayField

from tilavarauspalvelu.models import Unit

__all__ = [
    "UnitAdminForm",
]


class UnitAdminForm(forms.ModelForm):
    search_terms = DynamicArrayField(
        required=False,
        default=list,
        label=_("Search terms"),
        help_text=_(
            "Additional search terms that will bring up this unit's reservation units when making text searches "
            "in the customer UI. These terms should be added to make sure search results using text search in "
            "links from external sources work regardless of the UI language."
        ),
    )

    class Meta:
        model = Unit
        fields = []  # Use fields from ModelAdmin
        widgets = {
            "short_description": Textarea(),
        }
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
