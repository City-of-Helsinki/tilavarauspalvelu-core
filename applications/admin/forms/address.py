from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import Address


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
            "city": _("City name"),
        }
        help_texts = {
            "street_address": _("Street address"),
            "post_code": _("Post code"),
            "city": _("City name"),
        }
