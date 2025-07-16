from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import models
from undine import Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import ApplicationSection, Reservation
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime
from utils.db import NowTT

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo


class ApplicationSectionReservationCancellationMutation(MutationType[ApplicationSection], auto=False):
    """Cancel all reservations in the given application section that can be cancelled."""

    pk = Input(required=True)
    cancel_reason = Input(required=True)
    cancel_details = Input(required=False)

    class Meta:
        serializer_class = ApplicationSectionReservationCancellationInputSerializer
        output_serializer_class = ApplicationSectionReservationCancellationOutputSerializer

    @classmethod
    def __mutation__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        reservations = Reservation.objects.all()
        reservations = reservations.for_application_section(instance).filter(user=instance.application.user)

        future_reservations = reservations.filter(begins_at__gt=local_datetime())

        cancellable_reservations = (
            future_reservations.filter(
                type=ReservationTypeChoice.SEASONAL,
                state=ReservationStateChoice.CONFIRMED,
                price=0,
                reservation_unit__cancellation_rule__isnull=False,
            )
            .alias(
                cancellation_time=models.F("reservation_unit__cancellation_rule__can_be_cancelled_time_before"),
                cancellation_cutoff=NowTT() + models.F("cancellation_time"),
            )
            .filter(
                begins_at__gt=models.F("cancellation_cutoff"),
            )
            .distinct()
        )

        has_access_code = cancellable_reservations.requires_active_access_code().exists()

        cancellable_reservations_count = cancellable_reservations.count()
        future_reservations_count = future_reservations.count()

        data = CancellationOutput(
            expected_cancellations=future_reservations_count,
            actual_cancellations=cancellable_reservations_count,
        )

        cancellable_reservations.update(
            state=ReservationStateChoice.CANCELLED,
            cancel_reason=self.validated_data["cancel_reason"],
            cancel_details=self.validated_data.get("cancel_details", ""),
        )

        if cancellable_reservations_count:
            EmailService.send_seasonal_booking_cancelled_all_email(application_section=self.instance)
            EmailService.send_seasonal_booking_cancelled_all_staff_notification_email(application_section=self.instance)

            if has_access_code:
                # Reschedule the seasonal booking to remove all cancelled reservations.
                # This might leave behind empty series', which is fine.
                PindoraService.reschedule_access_code(self.instance)

        return data

    @classmethod
    def __permissions__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if user != instance.application.user:
            msg = "No permission to manage this application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        if instance.application.application_round.status != ApplicationRoundStatusChoice.RESULTS_SENT:
            msg = "Application sections application round is not in 'RESULTS_SENT' state."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_RESULTS_SENT_STATE)

    @classmethod
    def get_serializer_output(cls, instance: CancellationOutput) -> dict[str, Any]:
        # `instance` take from serializer.save() return value, so overriding it "works"
        return {
            "future": instance["expected_cancellations"],
            "cancelled": instance["actual_cancellations"],
        }
