from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Reservation, User


class ReservationUpdateMutation(MutationType[Reservation]):
    """Update reservation during checkout."""

    pk = Input(required=True)

    # Basic information
    name = Input()
    description = Input()
    num_persons = Input()
    municipality = Input()

    # Free of charge information
    applying_for_free_of_charge = Input()
    free_of_charge_reason = Input()

    # Reservee information
    reservee_identifier = Input()
    reservee_first_name = Input()
    reservee_last_name = Input()
    reservee_email = Input()
    reservee_phone = Input()
    reservee_organisation_name = Input()
    reservee_address_street = Input()
    reservee_address_city = Input()
    reservee_address_zip = Input()
    reservee_type = Input()

    # Relations
    age_group = Input()
    purpose = Input()

    @classmethod
    def __permissions__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_reservation(instance):
            msg = "No permission to update this reservation."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        instance.validators.validate_can_change_reservation()
        instance.validators.validate_free_of_charge_arguments(**input_data)
        instance.validators.validate_required_metadata_fields(**input_data)
