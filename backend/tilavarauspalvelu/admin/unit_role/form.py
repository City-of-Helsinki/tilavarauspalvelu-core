from __future__ import annotations

from django import forms

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import UnitRole

__all__ = [
    "UnitRoleAdminForm",
]


class UnitRoleAdminForm(forms.ModelForm):
    class Meta:
        model = UnitRole
        fields = []  # Use fields from ModelAdmin

    role = forms.ChoiceField(
        # Exclude NOTIFICATION_MANAGER from the role choices in the admin form
        choices=[role for role in UserRoleChoice.choices if role[0] != UserRoleChoice.NOTIFICATION_MANAGER],
        widget=forms.Select,
    )
