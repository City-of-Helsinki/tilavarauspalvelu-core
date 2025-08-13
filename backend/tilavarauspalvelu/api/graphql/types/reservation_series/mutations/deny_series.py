from typing import Any, TypedDict

from django.conf import settings
from django.db import models, transaction
from graphql import GraphQLOutputType
from undine import GQLInfo, Input, MutationType
from undine.converters import convert_to_graphql_type
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import ReservationDenyReason, ReservationSeries, User
from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task
from tilavarauspalvelu.typing import ReservationSeriesDenyData, error_codes
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesDenyMutation",
]


class ReservationSeriesDenyMutationOutput(TypedDict):
    denied: int
    future: int


class ReservationSeriesDenyMutation(MutationType[ReservationSeries]):
    pk = Input(required=True)

    deny_reason = Input(int, required=True, input_only=False)
    handling_details = Input(str, required=False, input_only=False)

    @classmethod
    def __mutate__(
        cls,
        root: Any,
        info: GQLInfo[User],
        input_data: ReservationSeriesDenyData,
    ) -> ReservationSeriesDenyMutationOutput:
        deny_reason = get_instance_or_raise(model=ReservationDenyReason, pk=input_data["deny_reason"])

        instance = get_instance_or_raise(model=ReservationSeries, pk=input_data["pk"])
        reservation_unit = instance.reservation_unit

        user = info.context.user
        is_reservee = instance.user == user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=is_reservee):
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

        now = local_datetime()

        reservations: ReservationQuerySet = instance.reservations.filter(  # type: ignore[attr-defined]
            begins_at__gt=now,
            state__in=ReservationStateChoice.states_that_can_change_to_deny,
        )

        has_access_code = reservations.requires_active_access_code().exists()

        with transaction.atomic():
            reservations.update(
                state=ReservationStateChoice.DENIED,
                deny_reason=deny_reason,
                handling_details=input_data.get("handling_details", models.F("handling_details")),
                handled_at=now,
            )

            # If any reservations had access codes, reschedule the series to remove all denied reservations.
            # This might leave an empty series, which is fine.
            if has_access_code:
                try:
                    PindoraService.reschedule_access_code(instance)
                except PindoraNotFoundError:
                    pass
                except ExternalServiceError as error:
                    raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        # Must refresh the materialized view since reservations state changed to 'DENIED'
        # TODO: Disabled for now, since it might contribute to timeouts in production.
        #  Refresh still happens on a background task every 2 minutes.
        #  if settings.UPDATE_AFFECTING_TIME_SPANS:  # noqa: ERA001,RUF100
        #      update_affecting_time_spans_task.delay()  # noqa: ERA001,RUF100

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        if instance.allocated_time_slot is not None:
            EmailService.send_seasonal_booking_denied_series_email(instance)

        future_reservations = instance.reservations.filter(begins_at__gt=now)
        future_all = future_reservations.count()
        future_denied = future_reservations.filter(state=ReservationStateChoice.DENIED).count()

        return ReservationSeriesDenyMutationOutput(denied=future_denied, future=future_all)

    @classmethod
    def __output_type__(cls) -> GraphQLOutputType:
        return convert_to_graphql_type(ReservationSeriesDenyMutationOutput)
