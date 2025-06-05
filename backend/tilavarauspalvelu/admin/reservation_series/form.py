from __future__ import annotations

import json
from typing import Any

from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, ReservationSeries
from utils.external_service.errors import ExternalServiceError


class ReservationSeriesAdminForm(forms.ModelForm):
    instance: ReservationSeries

    weekdays = forms.CharField(
        label=_("Weekdays"),
        help_text=_(
            "Comma separated list of weekday integers (0-6) on which reservations exists on this reservation series"
        ),
    )

    pindora_response = forms.CharField(
        widget=forms.Textarea(attrs={"disabled": True, "cols": "40", "rows": "1"}),
        required=False,
        label=_("Pindora API response"),
        help_text=_("Response from Pindora API"),
    )

    class Meta:
        model = ReservationSeries
        fields = []  # Use fields from ModelAdmin
        labels = {
            "ext_uuid": _("External UUID"),
            "name": _("Name"),
            "description": _("Description"),
            "begin_date": _("Begin date"),
            "begin_time": _("Begin time"),
            "end_date": _("End date"),
            "end_time": _("End time"),
            "recurrence_in_days": _("Recurrence in days"),
            "created_at": _("Created"),
            "user": _("User"),
            "reservation_unit": _("Reservation unit"),
            "allocated_time_slot": _("Allocated time slot"),
            "age_group": _("Age group"),
            "should_have_active_access_code": _("Should have active access code"),
            "access_type": _("Access type"),
            "used_access_types": _("Used access types"),
        }
        help_texts = {
            "ext_uuid": _("ID for external systems to use"),
            "name": _("Name of the reservation series"),
            "description": _("Description of the reservation series"),
            "begin_date": _("Begin date of the reservation series"),
            "begin_time": _("Begin time of reservations in this reservation series"),
            "end_date": _("End date of the reservation series"),
            "end_time": _("End time of reservations in this reservation series"),
            "recurrence_in_days": _("Interval between reservations in this reservation series"),
            "created_at": _("When this reservation series was created"),
            "user": _("User that created this reservation series"),
            "reservation_unit": _("Reservation unit for this reservation series"),
            "allocated_time_slot": _("Allocated time slot this reservation series is for"),
            "age_group": _("Age group for this reservation series"),
            "should_have_active_access_code": _("Should this reservation series have an active access code?"),
            "access_type": _(
                "Access type for the reservations in this reservation series (if unambiguous), "
                "otherwise access type will be 'multi-valued'"
            ),
            "used_access_types": _("All unique access types used in the reservations of this reservation series"),
        }
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4}),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        editing = getattr(self.instance, "pk", None) is not None

        if editing and self.instance.should_have_active_access_code:
            pindora_field = self.fields["pindora_response"]
            pindora_field.widget.attrs.update({"cols": "100", "rows": "20"})
            pindora_field.initial = self.get_pindora_response()

    def get_pindora_response(self) -> str | None:
        try:
            response = PindoraService.get_access_code(obj=self.instance)
        except ExternalServiceError as error:
            return str(error)

        return json.dumps(response._asdict(), default=str, indent=2)


class ReservationInline(admin.TabularInline):
    model = Reservation
    extra = 0
    max_num = 0
    show_change_link = True
    can_delete = False
    fields = [
        "id",
        "name",
        "begin",
        "end",
        "state",
        "type",
        "price",
        "price_net",
        "unit_price",
        "access_type",
    ]
    readonly_fields = fields
