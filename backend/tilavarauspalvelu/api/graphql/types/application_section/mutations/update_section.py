from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import Input, MutationType
from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.api.graphql.types.application.mutations.inputs import (
    ReservationUnitOptionInput,
    SuitableTimeRangeInput,
)
from tilavarauspalvelu.api.graphql.types.application.mutations.validation import validate_reservation_unit_options
from tilavarauspalvelu.models import ApplicationSection

if TYPE_CHECKING:
    from undine import GQLInfo


class ApplicationSectionUpdateMutation(MutationType[ApplicationSection], auto=False):
    pk = Input()
    name = Input()
    num_persons = Input()

    reservations_begin_date = Input()
    reservations_end_date = Input()

    reservation_min_duration = Input()
    reservation_max_duration = Input()
    applied_reservations_per_week = Input()

    purpose = Input()
    age_group = Input()
    reservation_unit_options = Input(ReservationUnitOptionInput)
    suitable_time_ranges = Input(SuitableTimeRangeInput)

    @classmethod
    def __permissions__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance.application):
            msg = "You do not have permission to manage this application."
            raise GraphQLValidationError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        options = input_data.get("reservation_unit_options", [])
        if options:
            path = info.path.add_key("reservationUnitOptions")
            validate_reservation_unit_options(instance, options, path)
