from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING, Any

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice, ReservationTypeChoice
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, local_start_of_day
from utils.utils import comma_sep_str

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

__all__ = [
    "ReservationValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationValidator:
    reservation: Reservation

    def validate_no_payment_order(self) -> None:
        if hasattr(self.reservation, "payment_order"):
            msg = "Reservation cannot be changed anymore because it is attached to a payment order"
            raise ValidationError(msg, code=error_codes.CHANGES_NOT_ALLOWED)

    def validate_can_change_reservation(self) -> None:
        """
        Should be used to validate that customers shouldn't be able to change reservations
        details after they have confirmed it during checkout. Customer may still reschedule
        reservation using different validation logic.
        """
        if self.reservation.state != ReservationStateChoice.CREATED:
            msg = "Reservation cannot be changed anymore."
            raise ValidationError(msg, code=error_codes.CHANGES_NOT_ALLOWED)

    def validate_free_of_charge_arguments(self, **metadata: Any) -> None:
        applying = metadata.get("applying_for_free_of_charge", self.reservation.applying_for_free_of_charge)
        reason = metadata.get("free_of_charge_reason", self.reservation.free_of_charge_reason)

        if applying and not reason:
            msg = "Free of charge reason is mandatory when applying for free of charge."
            raise ValidationError(msg, code=error_codes.REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE)

    def validate_required_metadata_fields(self, **metadata: Any) -> None:
        required_fields = self.reservation.actions.get_required_fields(
            reservee_type=metadata.get("reservee_type"),
            reservee_is_unregistered_association=metadata.get("reservee_is_unregistered_association"),
        )

        for required_field in required_fields:
            value = metadata.get(required_field, getattr(self.reservation, required_field, None))

            if not value:
                msg = f"Value for required field '{required_field}' is missing."
                raise ValidationError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

    def validate_reservation_not_handled(self) -> None:
        if self.reservation.handled_at is not None:
            msg = "Reservation cannot be modified since it has been handled"
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_not_paid(self) -> None:
        if self.reservation.price > 0:
            msg = "Paid reservations cannot be modified"
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_is_paid(self) -> None:
        if self.reservation.price <= 0:
            msg = "Only paid reservations can be refunded."
            raise ValidationError(msg, code=error_codes.ORDER_REFUND_NOT_ALLOWED)

    def validate_reservation_not_past_or_ongoing(self) -> None:
        if self.reservation.begins_at.astimezone(DEFAULT_TIMEZONE) < local_datetime():
            msg = "Past or ongoing reservations cannot be modified"
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_can_be_modified_by_staff(self) -> None:
        now = local_datetime()

        # Staff can modify reservations for today onwards,
        # or yesterday if it's the first hour of the day.
        min_allowed_datetime = local_start_of_day(now)
        if now.hour == 0:
            min_allowed_datetime -= datetime.timedelta(days=1)

        end = self.reservation.ends_at.astimezone(DEFAULT_TIMEZONE)
        if end < min_allowed_datetime:
            msg = "Reservation cannot be changed anymore."
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_state_allows_rescheduling(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_be_rescheduled:
            msg = "Reservation cannot be rescheduled based on its state"
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_type_allows_rescheduling(self) -> None:
        if self.reservation.type not in ReservationTypeChoice.types_that_can_be_rescheduled:
            msg = "Reservation cannot be rescheduled based on its type"
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_state_allows_approving(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_be_approved:
            msg = "Reservation cannot be approved based on its state"
            raise ValidationError(msg, code=error_codes.RESERVATION_APPROVING_NOT_ALLOWED)

    def validate_reservation_state_allows_cancelling(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_be_cancelled:
            msg = "Reservation cannot be cancelled based on its state"
            raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

    def validate_reservation_type_allows_cancelling(self) -> None:
        if self.reservation.type not in ReservationTypeChoice.types_that_can_be_cancelled:
            msg = "Reservation cannot be cancelled based on its type"
            raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

        if self.reservation.type == ReservationTypeChoice.SEASONAL.value and self.reservation.price > 0:
            msg = "Paid seasonal reservations cannot be cancelled."
            raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

    def validate_reservation_state_allows_denying(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_change_to_deny:
            msg = "Reservation cannot be denied based on its state"
            raise ValidationError(msg, code=error_codes.RESERVATION_DENYING_NOT_ALLOWED)

        now = local_datetime()
        end = self.reservation.ends_at.astimezone(DEFAULT_TIMEZONE)

        if self.reservation.state == ReservationStateChoice.CONFIRMED.value and end < now:
            msg = "Reservation cannot be denied after it has ended."
            raise ValidationError(msg, code=error_codes.RESERVATION_DENYING_NOT_ALLOWED)

    def validate_reservation_state_allows_handling(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_change_to_handling:
            msg = "Reservation cannot be handled based on its state"
            raise ValidationError(msg, code=error_codes.RESERVATION_STATE_CHANGE_NOT_ALLOWED)

    def validate_reservation_order_allows_refunding_or_cancellation(self) -> None:
        if not hasattr(self.reservation, "payment_order"):
            msg = "Reservation doesn't have an order."
            raise ValidationError(msg, code=error_codes.RESERVATION_NO_PAYMENT_ORDER)

        match self.reservation.payment_order.status:
            case OrderStatus.PAID_BY_INVOICE:
                self.reservation.payment_order.validators.validate_order_can_be_cancelled()

            case OrderStatus.PAID:
                self.reservation.payment_order.validators.validate_order_can_be_refunded()

            case _:
                msg = "Reservation order is not in a state where it can be refunded or cancelled"
                raise ValidationError(msg, code=error_codes.ORDER_REFUND_NOT_ALLOWED)

    def validate_reservation_state_allows_refunding_or_cancellation(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_be_refunded:
            msg = "Reservation cannot be refunded based on its state"
            raise ValidationError(msg, code=error_codes.ORDER_REFUND_NOT_ALLOWED)

    def validate_reservation_state_allows_staff_edit(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_be_edited_by_staff:
            msg = "Reservation cannot be edited by staff members based on its state"
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_type_allows_staff_edit(self, new_type: ReservationTypeChoice) -> None:
        is_normal = self.reservation.type == ReservationTypeChoice.NORMAL
        new_is_normal = new_type == ReservationTypeChoice.NORMAL

        if is_normal and not new_is_normal:
            msg = "A normal type reservation cannot be changed to any other type."
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        if new_is_normal and not is_normal:
            msg = "A reservation cannot be changed to a normal reservation from any other type."
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_access_type_is_access_code(self) -> None:
        if self.reservation.access_type != AccessType.ACCESS_CODE:
            msg = "Reservation access type does not use access codes."
            raise ValidationError(msg, code=error_codes.RESERVATION_WRONG_ACCESS_TYPE)

    def validate_reservation_has_access_code(self) -> None:
        self.validate_reservation_access_type_is_access_code()

        if self.reservation.access_code_generated_at is None:
            msg = "Reservation must have an access code to change it."
            raise ValidationError(msg, code=error_codes.RESERVATION_ACCESS_CODE_NOT_GENERATED)

    def validate_not_in_reservation_series(self) -> None:
        if self.reservation.reservation_series is not None:
            msg = "Reservation cannot be in a reservation series."
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_reservation_state_allows_access_code_change(self) -> None:
        if self.reservation.state not in ReservationStateChoice.states_that_can_change_access_code:
            msg = "Reservation access code cannot be changed based on its state."
            raise ValidationError(msg, code=error_codes.RESERVATION_ACCESS_CODE_CHANGE_NOT_ALLOWED)

    def validate_reservation_type_allows_access_code_change(self) -> None:
        if self.reservation.type not in ReservationTypeChoice.types_that_can_change_access_code:
            msg = "Reservation access code cannot be changed based on its type."
            raise ValidationError(msg, code=error_codes.RESERVATION_ACCESS_CODE_CHANGE_NOT_ALLOWED)

    def validate_reservation_has_not_ended(self) -> None:
        now = local_datetime()
        end = self.reservation.ends_at.astimezone(DEFAULT_TIMEZONE)

        if end <= now:
            msg = "Reservation has already ended."
            raise ValidationError(msg, code=error_codes.RESERVATION_HAS_ENDED)

    def validate_can_be_deleted(self, reservation: Reservation) -> None:
        if reservation.state not in ReservationStateChoice.states_that_can_be_deleted:
            states_str = comma_sep_str(ReservationStateChoice.states_that_can_be_deleted, last_sep="or", quote=True)
            msg = f"Reservation which is not in {states_str} state cannot be deleted."
            raise ValidationError(msg)
