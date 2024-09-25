from django import forms
from django.contrib import admin

from tilavarauspalvelu.models import ReservationMetadataField


class ReservationMetadataFieldForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataField
        fields = ("field_name",)
        widgets = {"field_name": forms.Select()}


@admin.register(ReservationMetadataField)
class ReservationMetadataFieldAdmin(admin.ModelAdmin):
    # List
    ordering = ("field_name",)

    # Form
    form = ReservationMetadataFieldForm

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False
