from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene.utils.str_converters import to_camel_case

from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeyUpdateSerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers._base_save_serializer import (
    ReservationBaseSaveSerializer,
)
from tilavarauspalvelu.enums import CustomerTypeChoice, ReservationStateChoice
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation, ReservationUnit


class ReservationUpdateSerializer(OldPrimaryKeyUpdateSerializer, ReservationBaseSaveSerializer):
    instance: Reservation

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = False
        self.fields["state"].required = False
        self.fields["reservee_first_name"].required = False
        self.fields["reservee_last_name"].required = False
        self.fields["reservee_phone"].required = False
        self.fields["reservee_language"].required = False
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["begin"].required = False
        self.fields["end"].required = False
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["reservation_unit_pks"].required = False
        self.fields["purpose_pk"].required = False

    def check_can_make_changes(self) -> None:
        if self.instance.state != ReservationStateChoice.CREATED.value:
            msg = "Reservation cannot be changed anymore."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.CHANGES_NOT_ALLOWED)

    def check_free_of_charge_reason_is_given(self, data: dict[str, Any]) -> None:
        if (
            data.get("applying_for_free_of_charge", self.instance.applying_for_free_of_charge)
            and not data.get("free_of_charge_reason", self.instance.free_of_charge_reason)  #
        ):
            msg = "Free of charge reason is mandatory when applying for free of charge."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE)

    def check_change_state(self, data: dict[str, Any]) -> str:
        new_state = data.get("state", self.instance.state)
        if new_state not in {ReservationStateChoice.CANCELLED.value, ReservationStateChoice.CREATED.value}:
            msg = f"Setting the reservation state to '{getattr(new_state, 'value', new_state)}' is not allowed."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.STATE_CHANGE_NOT_ALLOWED)
        return new_state

    def check_metadata_fields(self, data: dict[str, Any], reservation_unit: ReservationUnit) -> None:
        # Even marked in the metadata set to be mandatory, yet these never should be for private person.
        non_mandatory_fields_for_person = [
            "reservee_organisation_name",
            "home_city",
            "reservee_id",
        ]

        metadata_set = reservation_unit.metadata_set
        required_fields = metadata_set.required_fields.order_by("field_name").all() if metadata_set else []

        reservee_type = data.get("reservee_type", getattr(self.instance, "reservee_type", None))
        if required_fields and reservee_type == CustomerTypeChoice.INDIVIDUAL:
            required_fields = metadata_set.required_fields.exclude(field_name__in=non_mandatory_fields_for_person)

        for required_field in required_fields:
            internal_field_name = required_field.field_name
            existing_value = getattr(self.instance, internal_field_name, None)

            # If the reservee_is_unregistered_association is True it's not mandatory to give reservee_id
            # even if in metadata set says so.
            unregistered_field_name = "reservee_is_unregistered_association"
            if internal_field_name == "reservee_id" and data.get(
                unregistered_field_name,
                getattr(self.instance, unregistered_field_name, None),
            ):
                continue

            if not data.get(internal_field_name, existing_value):
                msg = f"Value for required field {to_camel_case(internal_field_name)} is missing."
                raise ValidationErrorWithCode(
                    msg,
                    ValidationErrorCodes.REQUIRED_FIELD_MISSING,
                    to_camel_case(internal_field_name),
                )

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        self.check_can_make_changes()
        self.check_free_of_charge_reason_is_given(data)
        new_state = self.check_change_state(data)

        data = super().validate(data)
        data["state"] = new_state

        reservation_units = self._get_reservation_units(data)
        for reservation_unit in reservation_units:
            self.check_metadata_fields(data, reservation_unit)

        return data

    @property
    def validated_data(self) -> dict[str, Any]:
        validated_data = super().validated_data
        validated_data["user"] = self.instance.user  # Do not change the user.
        validated_data["confirmed_at"] = local_datetime()
        return validated_data
