import datetime
from typing import Any, TypedDict

from graphql import GraphQLOutputType
from undine import GQLInfo, Input, MutationType
from undine.converters import convert_to_graphql_type
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationSeries, User
from tilavarauspalvelu.typing import error_codes
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesChangeAccessCodeMutation",
]


class ReservationSeriesChangeAccessCodeMutationOutput(TypedDict):
    pk: int
    access_code_generated_at: datetime.datetime | None
    access_code_is_active: bool


class ReservationSeriesChangeAccessCodeMutation(MutationType[ReservationSeries]):
    """Change the access code of a reservation series."""

    pk = Input(required=True)

    @classmethod
    def __mutate__(
        cls,
        root: Any,
        info: GQLInfo[User],
        input_data: dict[str, Any],
    ) -> ReservationSeriesChangeAccessCodeMutationOutput:
        instance = get_instance_or_raise(model=ReservationSeries, pk=input_data["pk"])
        reservation_unit = instance.reservation_unit

        user = info.context.user
        is_reservee = instance.user == user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=is_reservee):
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_series_has_ongoing_or_future_reservations()
        instance.validators.validate_has_access_code_access_type()
        instance.validators.validate_requires_active_access_code()

        try:
            response = PindoraService.change_access_code(obj=instance)

        except PindoraNotFoundError:
            if instance.allocated_time_slot is None:
                instance.reservations.update(access_code_generated_at=None, access_code_is_active=False)
                return ReservationSeriesChangeAccessCodeMutationOutput(
                    pk=instance.pk,
                    access_code_generated_at=None,
                    access_code_is_active=False,
                )

            section = instance.allocated_time_slot.reservation_unit_option.application_section
            Reservation.objects.all().for_application_section(section).update(
                access_code_generated_at=None,
                access_code_is_active=False,
            )
            return ReservationSeriesChangeAccessCodeMutationOutput(
                pk=instance.pk,
                access_code_generated_at=None,
                access_code_is_active=False,
            )

        except ExternalServiceError as error:
            raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        if not response["access_code_is_active"]:
            try:
                PindoraService.activate_access_code(obj=instance)
                response["access_code_is_active"] = True
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation series: {instance.pk}")

        if instance.allocated_time_slot is not None:
            section = instance.allocated_time_slot.reservation_unit_option.application_section

            if response["access_code_is_active"]:
                EmailService.send_seasonal_booking_access_code_changed_email(section)

        return ReservationSeriesChangeAccessCodeMutationOutput(
            pk=instance.pk,
            access_code_generated_at=response["access_code_generated_at"],
            access_code_is_active=response["access_code_is_active"],
        )

    @classmethod
    def __output_type__(cls) -> GraphQLOutputType:
        return convert_to_graphql_type(ReservationSeriesChangeAccessCodeMutationOutput)
