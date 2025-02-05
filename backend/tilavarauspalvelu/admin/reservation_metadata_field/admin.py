from __future__ import annotations

from django import forms
from django.contrib import admin

from tilavarauspalvelu.admin.helpers import ImmutableModelAdmin
from tilavarauspalvelu.models import ReservationMetadataField


class ReservationMetadataFieldForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataField
        fields = ("field_name",)
        widgets = {"field_name": forms.Select()}


@admin.register(ReservationMetadataField)
class ReservationMetadataFieldAdmin(ImmutableModelAdmin):
    # List
    ordering = ("field_name",)

    # Form
    form = ReservationMetadataFieldForm
