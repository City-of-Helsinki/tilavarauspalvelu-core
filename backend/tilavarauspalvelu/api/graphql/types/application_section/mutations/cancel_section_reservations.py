from typing import Any, TypedDict

from graphql import GraphQLObjectType
from undine import GQLInfo, Input, MutationType
from undine.converters import convert_to_graphql_type
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ReservationCancelReasonChoice, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import ApplicationSection, Reservation, User
from tilavarauspalvelu.typing import error_codes


class ApplicationSectionReservationCancellationMutationOutput(TypedDict):
    future: int
    cancelled: int


class ApplicationSectionReservationCancellationMutation(MutationType[ApplicationSection]):
    """Cancel all reservations in the given application section that can be cancelled."""

    pk = Input(required=True)
    cancel_reason = Input(ReservationCancelReasonChoice, input_only=False)
    cancel_details = Input(str, input_only=False, default_value="")

    @classmethod
    def __mutate__(
        cls,
        root: Any,
        info: GQLInfo[User],
        input_data: dict[str, Any],
    ) -> ApplicationSectionReservationCancellationMutationOutput:
        instance = ApplicationSection.objects.get(pk=input_data["pk"])

        user = info.context.user
        if user != instance.application.user:
            msg = "No permission to manage this application."
            raise GraphQLPermissionError(msg)

        if instance.application.application_round.status != ApplicationRoundStatusChoice.RESULTS_SENT:
            msg = "Application sections application round is not in 'RESULTS_SENT' state."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_RESULTS_SENT_STATE)

        reservations = Reservation.objects.all()
        future_reservations = reservations.future_reservations_in_section(instance)
        cancellable_reservations = reservations.cancellable_reservations_in_section(instance)

        has_access_code = cancellable_reservations.requires_active_access_code().exists()

        cancellable_reservations_count = cancellable_reservations.count()
        future_reservations_count = future_reservations.count()

        data = ApplicationSectionReservationCancellationMutationOutput(
            future=future_reservations_count,
            cancelled=cancellable_reservations_count,
        )

        cancellable_reservations.update(
            state=ReservationStateChoice.CANCELLED,
            cancel_reason=input_data["cancel_reason"],
            cancel_details=input_data["cancel_details"],
        )

        if cancellable_reservations_count:
            EmailService.send_seasonal_booking_cancelled_all_email(application_section=instance)
            EmailService.send_seasonal_booking_cancelled_all_staff_notification_email(application_section=instance)

            if has_access_code:
                # Reschedule the seasonal booking to remove all cancelled reservations.
                # This might leave behind empty series', which is fine.
                PindoraService.reschedule_access_code(instance)

        return data

    @classmethod
    def __output_type__(cls) -> GraphQLObjectType:
        return convert_to_graphql_type(ApplicationSectionReservationCancellationMutationOutput)
