from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError
from undine.typing import RelatedAction
from undine.utils.mutation_tree import mutate

from tilavarauspalvelu.models import (
    AgeGroup,
    Application,
    ApplicationRound,
    ApplicationSection,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitOption,
    SuitableTimeRange,
    User,
)
from tilavarauspalvelu.typing import ApplicationCreateData, error_codes

from .validation import validate_reservation_period, validate_reservation_unit_options

__all__ = [
    "ApplicationCreateMutation",
]


class ReservationUnitOptionCreateInput(MutationType[ReservationUnitOption], kind="related"):
    preferred_order = Input(required=True)
    reservation_unit = Input(ReservationUnit, required=True)


class SuitableTimeRangeCreateInput(MutationType[SuitableTimeRange], kind="related"):
    priority = Input(required=True)
    day_of_the_week = Input(required=True)
    begin_time = Input(required=True)
    end_time = Input(required=True)


class ApplicationSectionCreateInput(MutationType[ApplicationSection], kind="related"):
    name = Input(required=True)
    num_persons = Input(required=True)

    reservations_begin_date = Input(required=True)
    reservations_end_date = Input(required=True)

    reservation_min_duration = Input(required=True)
    reservation_max_duration = Input(required=True)
    applied_reservations_per_week = Input(required=True)

    purpose = Input(ReservationPurpose)
    age_group = Input(AgeGroup)
    reservation_unit_options = Input(ReservationUnitOptionCreateInput, many=True, required=True, default_value=[])
    suitable_time_ranges = Input(SuitableTimeRangeCreateInput, many=True, required=True, default_value=[])


class ApplicationCreateMutation(MutationType[Application], kind="create"):
    # Basic information
    applicant_type = Input()
    additional_information = Input()

    # Relations
    application_round = Input(ApplicationRound)
    application_sections = Input(ApplicationSectionCreateInput, many=True, required=True, default_value=[])

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
    def user(self, info: GQLInfo[User]) -> User | None:
        if info.context.user.is_anonymous:
            return None
        return info.context.user

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo[User], input_data: ApplicationCreateData) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "Must be authenticated to create an application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Application, info: GQLInfo[User], input_data: ApplicationCreateData) -> None:
        user: User = input_data["user"]

        user.validators.validate_is_of_age(code=error_codes.APPLICATION_ADULT_RESERVEE_REQUIRED)
        user.validators.validate_is_internal_user_if_ad_user()

        application_round = input_data["application_round"]
        application_round.validators.validate_open_for_applications()

        path = info.path.add_key("applicationSections")

        application_sections = input_data.get("application_sections", [])
        for index, section_data in enumerate(application_sections):
            sub_path = path.add_key(index)
            validate_reservation_period(application_round, section_data, path=sub_path)

            option_data = section_data.get("reservation_unit_options", [])
            if option_data:
                sub_path = sub_path.add_key("reservationUnitOptions")
                validate_reservation_unit_options(option_data, path=sub_path)

    @classmethod
    def __mutate__(cls, instance: Application, info: GQLInfo[User], input_data: ApplicationCreateData) -> Application:
        return mutate(model=Application, data=input_data, related_action=RelatedAction.delete)
