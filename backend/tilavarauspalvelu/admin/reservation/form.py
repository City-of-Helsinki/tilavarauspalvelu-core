from __future__ import annotations

import json
from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation
from utils.external_service.errors import ExternalServiceError


class ReservationAdminForm(forms.ModelForm):
    instance: Reservation

    access_type = forms.ChoiceField(choices=AccessType.model_choices, required=False)

    pindora_response = forms.CharField(
        widget=forms.Textarea(attrs={"disabled": True, "cols": "40", "rows": "1"}),
        required=False,
        label=_("Pindora API response"),
        help_text=_("Response from Pindora API"),
    )

    class Meta:
        model = Reservation
        fields = []  # Use fields from ModelAdmin
        labels = {
            #
            "ext_uuid": _("External UUID"),
            "sku": _("SKU"),
            "name": _("Name"),
            "description": _("Description"),
            "num_persons": _("Number of persons"),
            "state": _("State"),
            "type": _("Reservation type"),
            "cancel_details": _("Cancel details"),
            "handling_details": _("Handling details"),
            "working_memo": _("Working memo"),
            #
            "begin": _("Begin time"),
            "end": _("End time"),
            "buffer_time_before": _("Buffer time before"),
            "buffer_time_after": _("Buffer time after"),
            "handled_at": _("Handled at"),
            "confirmed_at": _("Confirmed at"),
            "created_at": _("Created at"),
            #
            "access_type": _("Access type"),
            "access_code_is_active": _("Access code is active"),
            "access_code_should_be_active": _("Access code should be active"),
            "access_code_generated_at": _("Access code generated at"),
            #
            "price": _("Price"),
            "price_net": _("Price net"),
            "non_subsidised_price": _("Non-subsidised price"),
            "non_subsidised_price_net": _("Non-subsidised net price"),
            "unit_price": _("Unit price"),
            "tax_percentage_value": _("Tax percentage value"),
            #
            "applying_for_free_of_charge": _("Applying free of charge"),
            "free_of_charge_reason": _("Free of charge reason"),
            #
            "reservee_id": _("Reservee ID"),
            "reservee_first_name": _("Reservee first name"),
            "reservee_last_name": _("Reservee last name"),
            "reservee_email": _("Reservee email"),
            "reservee_phone": _("Reservee phone"),
            "reservee_organisation_name": _("Reservee organisation name"),
            "reservee_address_street": _("Reservee address street"),
            "reservee_address_city": _("Reservee address city"),
            "reservee_address_zip": _("Reservee address zip code"),
            "reservee_is_unregistered_association": _("Reservee is an unregistered association"),
            "reservee_type": _("Type of reservee"),
            #
            "billing_first_name": _("Billing first name"),
            "billing_last_name": _("Billing last name"),
            "billing_email": _("Billing email"),
            "billing_phone": _("Billing phone"),
            "billing_address_street": _("Billing address street"),
            "billing_address_city": _("Billing address city"),
            "billing_address_zip": _("Billing address zip code"),
            #
            "user": _("User"),
            "recurring_reservation": _("Recurring reservation"),
            "deny_reason": _("Reason for deny"),
            "cancel_reason": _("Reason for cancellation"),
            "purpose": _("Reservation purpose"),
            "home_city": _("Home city"),
            "age_group": _("Age group"),
        }
        help_texts = {
            #
            "ext_uuid": _("ID for external systems to use"),
            "sku": _("SKU for this particular reservation"),
            "name": _("Name of the reservation"),
            "description": _("Description of the reservation"),
            "num_persons": _("Number of persons in the reservation"),
            "state": _("State of the reservation"),
            "type": _("Type of reservation"),
            "cancel_details": _("Details for this reservation's cancellation"),
            "handling_details": _("Additional details for denying or approving the reservation"),
            "working_memo": _("Working memo for staff users"),
            #
            "begin": _("Reservation begin date and time"),
            "end": _("Reservation end date and time"),
            "buffer_time_before": _("Buffer time before reservation"),
            "buffer_time_after": _("Buffer time after reservation"),
            "handled_at": _("When this reservation was handled"),
            "confirmed_at": _("When this reservation was confirmed"),
            "created_at": _("When this reservation was created"),
            #
            "access_type": _("Access type"),
            "access_code_is_active": _("Access code is active"),
            "access_code_should_be_active": _("Access code should be active"),
            "access_code_generated_at": _("Access code generated at"),
            #
            "price": _("The price of this particular reservation including VAT"),
            "price_net": _("The price of this particular reservation excluding VAT"),
            "non_subsidised_price": _("The non subsidised price of this reservation including VAT"),
            "non_subsidised_price_net": _("The non subsidised price of this reservation excluding VAT"),
            "unit_price": _("The unit price of this particular reservation"),
            "tax_percentage_value": _("The value of the tax percentage for this particular reservation"),
            #
            "applying_for_free_of_charge": _("Reservee is applying for a free-of-charge reservation"),
            "free_of_charge_reason": _("Reason for applying for a free-of-charge reservation"),
            #
            "reservee_id": _("Reservee's business or association identity code"),
            "reservee_first_name": _("Reservee's first name"),
            "reservee_last_name": _("Reservee's last name"),
            "reservee_email": _("Reservee's email address"),
            "reservee_phone": _("Reservee's phone number"),
            "reservee_organisation_name": _("Reservee's organisation name"),
            "reservee_address_street": _("Reservee's street address"),
            "reservee_address_city": _("Reservee's city"),
            "reservee_address_zip": _("Reservee's zip code"),
            "reservee_is_unregistered_association": _("Reservee is an unregistered association"),
            "reservee_type": _("Type of reservee"),
            #
            "billing_first_name": _("Billing first name"),
            "billing_last_name": _("Billing last name"),
            "billing_email": _("Billing email"),
            "billing_phone": _("Billing phone"),
            "billing_address_street": _("Billing address street"),
            "billing_address_city": _("Billing address city"),
            "billing_address_zip": _("Billing address zip code"),
            #
            "user": _("User who made the reservation"),
            "recurring_reservation": _("Recurring reservation"),
            "deny_reason": _("Reason for denying the reservation"),
            "cancel_reason": _("Reason for cancelling the reservation"),
            "purpose": _("Purpose of the reservation"),
            "home_city": _("Reservee's home city"),
            "age_group": _("Age group of the group or association"),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        editing = getattr(self.instance, "pk", None) is not None

        if editing and self.instance.access_type == AccessType.ACCESS_CODE:
            pindora_field = self.fields["pindora_response"]
            pindora_field.widget.attrs.update({"cols": "100", "rows": "20"})
            pindora_field.initial = self.get_pindora_response()

    def get_pindora_response(self) -> str | None:
        try:
            response = PindoraService.get_access_code(obj=self.instance)
        except ExternalServiceError as error:
            return str(error)

        return json.dumps(response, default=str, indent=2)
