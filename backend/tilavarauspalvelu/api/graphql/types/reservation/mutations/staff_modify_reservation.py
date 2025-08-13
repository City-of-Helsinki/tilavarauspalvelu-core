from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.enums import AccessType, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose, User
from tilavarauspalvelu.typing import StaffReservationUpdateData
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationStaffModifyMutation",
]


class ReservationStaffModifyMutation(MutationType[Reservation]):
    """Modify a reservation as a staff member."""

    pk = Input(required=True)

    # Basic information
    name = Input()
    description = Input()
    num_persons = Input()
    type = Input()
    municipality = Input()

    # Free of charge information
    applying_for_free_of_charge = Input()
    free_of_charge_reason = Input()

    # Reservee information
    reservee_first_name = Input()
    reservee_last_name = Input()
    reservee_phone = Input()
    reservee_organisation_name = Input()
    reservee_address_street = Input()
    reservee_address_city = Input()
    reservee_address_zip = Input()
    reservee_email = Input()
    reservee_type = Input()
    reservee_identifier = Input()

    # Relations
    age_group = Input(AgeGroup)
    purpose = Input(ReservationPurpose)

    @classmethod
    def __mutate__(cls, root: Any, info: GQLInfo[User], input_data: StaffReservationUpdateData) -> Reservation:
        instance = get_instance_or_raise(model=Reservation, pk=input_data["pk"])

        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to update this reservation."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_state_allows_staff_edit()
        instance.validators.validate_reservation_can_be_modified_by_staff()

        type_before = instance.type
        type_after = input_data.get("type", type_before)
        has_new_type = type_before != type_after

        if has_new_type:
            instance.validators.validate_reservation_type_allows_staff_edit(new_type=type_after)

        for key, value in input_data.items():
            setattr(instance, key, value)

        instance.save()

        # If reservation was changed to or from blocked, change access code active state in Pindora.
        changed_with_blocked = has_new_type and ReservationTypeChoice.BLOCKED in {type_before, type_after}

        if instance.access_type == AccessType.ACCESS_CODE and changed_with_blocked:
            # Allow mutation to succeed even if Pindora request fails.
            try:
                if type_after == ReservationTypeChoice.BLOCKED:
                    PindoraService.deactivate_access_code(obj=instance)
                else:
                    PindoraService.activate_access_code(obj=instance)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        return instance
