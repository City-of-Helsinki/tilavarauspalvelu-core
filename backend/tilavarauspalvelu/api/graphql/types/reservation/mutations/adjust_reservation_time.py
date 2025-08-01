from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import ReservationAdjustTimeData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationAdjustTimeMutation",
]


class ReservationAdjustTimeMutation(MutationType[Reservation]):
    """Adjust the time for a reservation."""

    pk = Input(required=True)
    begins_at = Input(required=True)
    ends_at = Input(required=True)

    @classmethod
    def __mutate__(cls, root: Any, info: GQLInfo[User], input_data: ReservationAdjustTimeData) -> Reservation:  # noqa: PLR0915
        instance = get_instance_or_raise(model=Reservation, pk=input_data["pk"])

        user = info.context.user
        if not user.permissions.can_manage_reservation(instance):
            msg = "No permission to adjust reservation time."
            raise GraphQLPermissionError(msg)

        instance.user.validators.validate_is_internal_user_if_ad_user()

        instance.validators.validate_reservation_state_allows_rescheduling()
        instance.validators.validate_reservation_type_allows_rescheduling()
        instance.validators.validate_reservation_not_handled()
        instance.validators.validate_reservation_not_paid()
        instance.validators.validate_reservation_not_past_or_ongoing()

        current_begins_at = instance.begins_at.astimezone(DEFAULT_TIMEZONE)
        begins_at = input_data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at = input_data["ends_at"].astimezone(DEFAULT_TIMEZONE)

        reservation_unit = instance.reservation_unit
        reservation_unit.validators.validate_reservation_unit_is_direct_bookable()
        reservation_unit.validators.validate_reservation_unit_is_published()
        reservation_unit.validators.validate_reservation_unit_is_reservable_at(begin=begins_at)
        reservation_unit.validators.validate_begin_before_end(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_duration_is_allowed(duration=ends_at - begins_at)
        reservation_unit.validators.validate_reservation_days_before(begin=begins_at)
        reservation_unit.validators.validate_reservation_unit_is_open(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_not_rescheduled_to_paid_date(begin=begins_at)
        reservation_unit.validators.validate_cancellation_rule(begin=current_begins_at)
        reservation_unit.validators.validate_not_in_open_application_round(begin=begins_at.date(), end=ends_at.date())
        reservation_unit.validators.validate_reservation_begin_time(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at, ends_at=ends_at, ignore_ids=[instance.pk]
        )

        had_access_code = instance.access_type == AccessType.ACCESS_CODE

        previous_data: dict[str, Any] = {
            "begins_at": instance.begins_at,
            "ends_at": instance.ends_at,
            "buffer_time_before": instance.buffer_time_before,
            "buffer_time_after": instance.buffer_time_after,
            "access_type": instance.access_type,
            "state": instance.state,
        }

        instance.begins_at = begins_at
        instance.ends_at = ends_at
        instance.buffer_time_before = reservation_unit.actions.get_actual_before_buffer(begins_at)
        instance.buffer_time_after = reservation_unit.actions.get_actual_after_buffer(ends_at)
        instance.access_type = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        if instance.requires_handling:
            instance.state = ReservationStateChoice.REQUIRES_HANDLING

        instance.save()

        # After rescheduling the reservation, check for overlapping reservations again.
        # This can fail if another reservation is created of moved to the same time
        # in a reservation unit in the same space-resource hierarchy at almost the same time.
        if instance.actions.overlapping_reservations().exists():
            cls.rollback(instance=instance, previous_data=previous_data)
            msg = "Overlapping reservations were created at the same time."
            raise GraphQLValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        has_access_code = instance.access_type == AccessType.ACCESS_CODE

        if had_access_code or has_access_code:
            try:
                PindoraService.sync_access_code(obj=instance)
            except ExternalServiceError as error:
                cls.rollback(instance=instance, previous_data=previous_data)
                raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        EmailService.send_reservation_rescheduled_email(reservation=instance)

        if instance.state == ReservationStateChoice.REQUIRES_HANDLING:
            EmailService.send_reservation_requires_handling_staff_notification_email(reservation=instance)

        return instance

    @classmethod
    def rollback(cls, instance: Reservation, previous_data: dict[str, Any]) -> None:
        for key, value in previous_data.items():
            setattr(instance, key, value)
        instance.save()
