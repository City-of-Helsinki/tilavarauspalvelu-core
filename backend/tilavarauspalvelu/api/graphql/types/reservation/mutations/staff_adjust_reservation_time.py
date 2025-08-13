from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import StaffReservationAdjustTimeData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError


class ReservationStaffAdjustTimeMutation(MutationType[Reservation]):
    """Adjust a reservation's time as a staff member."""

    pk = Input(required=True)
    begins_at = Input(required=True)
    ends_at = Input(required=True)

    buffer_time_before = Input(required=False)
    buffer_time_after = Input(required=False)

    @classmethod
    def __mutate__(cls, root: Any, info: GQLInfo[User], input_data: StaffReservationAdjustTimeData) -> Reservation:
        instance = get_instance_or_raise(model=Reservation, pk=input_data["pk"])

        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to adjust this reservation's time."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_state_allows_rescheduling()
        instance.validators.validate_reservation_can_be_modified_by_staff()

        begins_at = input_data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at = input_data["ends_at"].astimezone(DEFAULT_TIMEZONE)
        buffer_time_before = input_data.get("buffer_time_before", instance.buffer_time_before)
        buffer_time_after = input_data.get("buffer_time_after", instance.buffer_time_before)

        reservation_unit = instance.reservation_unit

        if reservation_unit.reservation_block_whole_day:
            buffer_time_before = reservation_unit.actions.get_actual_before_buffer(begins_at)
            buffer_time_after = reservation_unit.actions.get_actual_after_buffer(ends_at)

        reservation_unit.validators.validate_begin_before_end(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at,
            ends_at=ends_at,
            new_buffer_time_before=buffer_time_before,
            new_buffer_time_after=buffer_time_after,
            ignore_ids=[instance.pk],
        )

        access_type = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        previous_data = {
            "begins_at": instance.begins_at,
            "ends_at": instance.ends_at,
            "buffer_time_before": instance.buffer_time_before,
            "buffer_time_after": instance.buffer_time_after,
            "access_type": instance.access_type,
        }

        had_access_code = instance.access_type == AccessType.ACCESS_CODE
        has_access_codes = access_type == AccessType.ACCESS_CODE

        instance.begins_at = begins_at
        instance.ends_at = ends_at
        instance.buffer_time_before = buffer_time_before
        instance.buffer_time_after = buffer_time_after
        instance.access_type = access_type
        instance.save()

        # After rescheduling the reservation, check for overlapping reservations again.
        # This can fail if another reservation is created of moved to the same time
        # in a reservation unit in the same space-resource hierarchy at almost the same time.
        if instance.actions.overlapping_reservations().exists():
            cls.rollback(instance=instance, previous_data=previous_data)
            msg = "Overlapping reservations were created at the same time."
            raise GraphQLValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        if had_access_code or has_access_codes:
            try:
                PindoraService.sync_access_code(obj=instance)
            except ExternalServiceError as error:
                cls.rollback(instance=instance, previous_data=previous_data)
                raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        EmailService.send_reservation_rescheduled_email(reservation=instance)
        EmailService.send_reservation_requires_handling_staff_notification_email(reservation=instance)

        return instance

    @classmethod
    def rollback(cls, instance: Reservation, previous_data: dict[str, Any]) -> None:
        for key, value in previous_data.items():
            setattr(instance, key, value)
        instance.save()
