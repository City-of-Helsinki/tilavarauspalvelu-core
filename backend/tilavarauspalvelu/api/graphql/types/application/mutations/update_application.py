from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError
from undine.typing import RelatedAction
from undine.utils.model_utils import get_instance_or_raise
from undine.utils.mutation_tree import mutate

from tilavarauspalvelu.models import (
    AgeGroup,
    Application,
    ApplicationSection,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitOption,
    SuitableTimeRange,
    User,
)
from tilavarauspalvelu.typing import ApplicationUpdateData

from .validation import validate_reservation_period, validate_reservation_unit_options

__all__ = [
    "ApplicationUpdateMutation",
]


class ReservationUnitOptionUpdateInput(MutationType[ReservationUnitOption], kind="related"):
    pk = Input()
    preferred_order = Input()
    reservation_unit = Input(ReservationUnit)


class SuitableTimeRangeUpdateInput(MutationType[SuitableTimeRange], kind="related"):
    pk = Input()
    priority = Input()
    day_of_the_week = Input()
    begin_time = Input()
    end_time = Input()


class ApplicationSectionUpdateInput(MutationType[ApplicationSection], kind="related"):
    pk = Input()
    name = Input()
    num_persons = Input()

    reservations_begin_date = Input()
    reservations_end_date = Input()

    reservation_min_duration = Input()
    reservation_max_duration = Input()
    applied_reservations_per_week = Input()

    purpose = Input(ReservationPurpose)
    age_group = Input(AgeGroup)
    reservation_unit_options = Input(ReservationUnitOptionUpdateInput, many=True)
    suitable_time_ranges = Input(SuitableTimeRangeUpdateInput, many=True)


class ApplicationUpdateMutation(MutationType[Application], kind="update"):
    pk = Input(required=True)

    # Basic information
    applicant_type = Input()
    additional_information = Input()

    # Relations
    application_sections = Input(ApplicationSectionUpdateInput, many=True)

    # Contact person
    contact_person_first_name = Input()
    contact_person_last_name = Input()
    contact_person_email = Input()
    contact_person_phone_number = Input()

    # Billing address
    billing_street_address = Input()
    billing_post_code = Input()
    billing_city = Input()

    # Organisation
    organisation_name = Input()
    organisation_email = Input()
    organisation_identifier = Input()
    organisation_year_established = Input()
    organisation_active_members = Input()
    organisation_core_business = Input()
    organisation_street_address = Input()
    organisation_post_code = Input()
    organisation_city = Input()
    municipality = Input()

    @Input(hidden=True)
    def sent_at(self, info: GQLInfo[User]) -> None:
        # If a sent application is updated, it needs to be sent and validated again
        return None

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo[User], input_data: ApplicationUpdateData) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance):
            msg = "No permission to manage this application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Application, info: GQLInfo[User], input_data: ApplicationUpdateData) -> None:
        application_round = instance.application_round
        application_round.validators.validate_open_for_applications()

        path = info.path.add_key("applicationSections")

        application_sections = input_data.get("application_sections", [])
        for index, section_data in enumerate(application_sections):
            sub_path = path.add_key(index)
            validate_reservation_period(application_round, section_data, path=sub_path)

            pk = section_data.get("pk")
            section = None if pk is None else get_instance_or_raise(model=ApplicationSection, pk=pk)

            option_data = section_data.get("reservation_unit_options", [])
            if option_data:
                sub_path = sub_path.add_key("reservationUnitOptions")
                validate_reservation_unit_options(option_data, path=sub_path, instance=section)

    @classmethod
    def __mutate__(cls, instance: Application, info: GQLInfo[User], input_data: ApplicationUpdateData) -> Application:
        return mutate(model=Application, data=input_data, related_action=RelatedAction.delete)
