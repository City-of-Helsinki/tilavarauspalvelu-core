from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .models import (
    AbilityGroup,
    AgeGroup,
    RecurringReservation,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
)


class ReservationInline(admin.TabularInline):
    model = Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    model = Reservation


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    model = RecurringReservation
    inlines = [ReservationInline]


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(admin.ModelAdmin):
    model = ReservationPurpose


@admin.register(AgeGroup)
class AgeGroupAdmin(admin.ModelAdmin):
    model = AgeGroup


@admin.register(AbilityGroup)
class AbilityGroupAdmin(admin.ModelAdmin):
    model = AbilityGroup


@admin.register(ReservationCancelReason)
class ReservationCancelReasonAdmin(admin.ModelAdmin):
    model = ReservationCancelReason


@admin.register(ReservationDenyReason)
class ReservationDenyReasonAdmin(admin.ModelAdmin):
    model = ReservationDenyReason


class ReservationMetadataFieldForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataField
        fields = ("field_name",)
        widgets = {"field_name": forms.Select()}


@admin.register(ReservationMetadataField)
class ReservationMetadataFieldAdmin(admin.ModelAdmin):
    form = ReservationMetadataFieldForm
    ordering = ("field_name",)

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


class ReservationMetadataSetForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataSet
        exclude = ("id",)

    def clean(self):
        supported = set(self.cleaned_data.get("supported_fields"))
        required = set(self.cleaned_data.get("required_fields"))
        if not required.issubset(supported):
            raise ValidationError(
                _("Required fields must be a subset of supported fields")
            )
        return self.cleaned_data


@admin.register(ReservationMetadataSet)
class ReservationMetadataSetAdmin(admin.ModelAdmin):
    exclude = ("id",)
    form = ReservationMetadataSetForm
