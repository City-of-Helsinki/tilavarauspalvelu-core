from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import UnitRole

if TYPE_CHECKING:
    from django import forms
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "UnitRoleAdmin",
]


@admin.register(UnitRole)
class UnitRoleAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "units__name",
        "unit_groups__name",
    ]
    search_help_text = _("Search by user's username, email, first name, last name, unit or unit group")

    # List
    list_display = [
        "role",
        "user_email",
        "unit_names",
        "unit_group_names",
        "role_active",
    ]
    list_filter = [
        "role",
        "units",
        "unit_groups",
        "role_active",
        "is_from_ad_group",
    ]

    # Form
    fields = [
        "role_active",
        "role",
        "user",
        "assigner",
        "created",
        "modified",
        "is_from_ad_group",
        "units",
        "unit_groups",
    ]
    readonly_fields = [
        "assigner",
        "created",
        "modified",
        "is_from_ad_group",
    ]
    autocomplete_fields = [
        "user",
    ]
    filter_horizontal = [
        "units",
        "unit_groups",
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .select_related(
                "user",
                "assigner",
            )
            .prefetch_related(
                "units",
                "unit_groups",
            )
        )

    def save_model(self, request: WSGIRequest, obj: UnitRole, form: forms.ModelForm, change: bool) -> UnitRole:  # noqa: FBT001
        obj.assigner = request.user
        return super().save_model(request, obj, form, change)

    @admin.display(ordering="user__email")
    def user_email(self, obj: UnitRole) -> str:
        return obj.user.email

    @admin.display(ordering="units__name")
    def unit_names(self, obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.units.all()])

    @admin.display(ordering="unit_groups__name")
    def unit_group_names(self, obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit_groups.all()])
