from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Application, User

from .inputs import ApplicationSectionInput
from .validation import validate_application_sections

__all__ = [
    "ApplicationUpdateMutation",
]


class ApplicationUpdateMutation(MutationType[Application], kind="update"):
    # Basic information
    pk = Input(required=True)
    applicant_type = Input()
    additional_information = Input()

    # Relations
    application_sections = Input(ApplicationSectionInput, many=True)

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
    def __permissions__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance):
            msg = "No permission to manage this application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        application_round = instance.application_round
        application_round.validators.validate_open_for_applications()

        path = info.path.add_key("applicationSections")
        application_sections: list[dict[str, Any]] = input_data.get("application_sections", [])
        validate_application_sections(application_round, application_sections, path)
