from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.api.graphql.types.application.mutations.inputs import (
    ReservationUnitOptionInput,
    SuitableTimeRangeInput,
)
from tilavarauspalvelu.api.graphql.types.application.mutations.validation import validate_reservation_unit_options
from tilavarauspalvelu.models import Application, ApplicationSection
from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from undine import GQLInfo


class ApplicationSectionCreateMutation(MutationType[ApplicationSection], auto=False):
    name = Input()
    num_persons = Input()

    reservations_begin_date = Input()
    reservations_end_date = Input()

    reservation_min_duration = Input()
    reservation_max_duration = Input()
    applied_reservations_per_week = Input()

    application = Input()
    purpose = Input()
    age_group = Input()
    reservation_unit_options = Input(ReservationUnitOptionInput)
    suitable_time_ranges = Input(SuitableTimeRangeInput)

    @classmethod
    def __permissions__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        application_pk = input_data.get("application")
        if application_pk is None:
            msg = "Application is required for creating an Application Section."
            raise GraphQLPermissionError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        application = Application.objects.filter(pk=application_pk).first()
        if application is None:
            msg = f"Application with pk {application_pk} does not exist."
            raise GraphQLPermissionError(msg, code=error_codes.ENTITY_NOT_FOUND)

        user = info.context.user
        if not user.permissions.can_manage_application(application):
            msg = "You do not have permission to manage this application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        options = input_data.get("reservation_unit_options", [])
        if options:
            path = info.path.add_key("reservationUnitOptions")
            validate_reservation_unit_options(instance, options, path)
