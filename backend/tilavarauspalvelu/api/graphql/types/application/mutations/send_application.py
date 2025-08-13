import datetime
from collections import defaultdict
from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLErrorGroup, GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ReserveeType, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Application, ApplicationSection, User
from tilavarauspalvelu.typing import ErrorList, error_codes
from utils.date_utils import TimeSlot, local_datetime, local_timedelta_string, merge_time_slots, time_difference

__all__ = [
    "ApplicationSendMutation",
]


class ApplicationSendMutation(MutationType[Application], kind="update"):
    pk = Input(required=True)

    @Input(hidden=True)
    def sent_at(self, info: GQLInfo[User]) -> datetime.datetime:
        return local_datetime()

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance):
            msg = "No permission to send this application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        errors: ErrorList = []

        cls.validate_application_sections(instance, errors)
        cls.validate_applicant(instance, errors)
        cls.validate_user(instance.user, errors)

        status = instance.status
        if not status.can_send:
            msg = f"Application in status '{status.value}' cannot be sent."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_STATUS_CANNOT_SEND)
            errors.append(error)

        if errors:
            raise GraphQLErrorGroup(errors)

    @classmethod
    def validate_application_sections(cls, instance: Application, errors: ErrorList) -> None:
        """Validate section and related data that has not been validated by database constraints."""
        sections = instance.application_sections.all()

        if not sections:
            msg = "Application requires application sections before it can be sent."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTIONS_MISSING)
            errors.append(error)
            return

        for section in sections:
            if not section.name:
                msg = f"Application section {section.pk} name cannot be empty."
                error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_EMPTY_NAME)
                errors.append(error)

            if section.num_persons < 1:
                msg = f"Application section {section.pk} must be for at least one person."
                error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_NUM_PERSONS_ZERO)
                errors.append(error)

            if section.age_group is None:
                msg = f"Application section {section.pk} must have age group set."
                error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_AGE_GROUP_MISSING)
                errors.append(error)

            if section.purpose is None:
                msg = f"Application section {section.pk} must have its purpose set."
                error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_PURPOSE_MISSING)
                errors.append(error)

            cls.validate_suitable_time_ranges(section, errors)

            number_of_reservation_unit_options = section.reservation_unit_options.count()
            if number_of_reservation_unit_options < 1:
                msg = f"Application section {section.pk} must have at least one reservation unit option selected."
                error = GraphQLValidationError(
                    msg, code=error_codes.APPLICATION_SECTION_RESERVATION_UNIT_OPTIONS_MISSING
                )
                errors.append(error)

    @classmethod
    def validate_suitable_time_ranges(cls, section: ApplicationSection, errors: ErrorList) -> None:
        time_ranges = section.suitable_time_ranges.all()

        if not time_ranges:
            msg = f"Application section {section.pk} must have at least one suitable time range selected."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGES_MISSING)
            errors.append(error)
            return

        # Merge suitable times per weekday.
        time_slots: dict[Weekday, list[TimeSlot]] = defaultdict(list)
        for time_range in time_ranges:
            weekday = Weekday(time_range.day_of_the_week)
            timeslot = TimeSlot(begin_time=time_range.begin_time, end_time=time_range.end_time)
            time_slots[weekday].append(timeslot)

        for weekday in list(time_slots):
            time_slots[weekday] = merge_time_slots(time_slots[weekday])

        number_of_suitable_weekdays = len(time_slots)
        if number_of_suitable_weekdays < section.applied_reservations_per_week:
            msg = (
                f"Application section {section.pk} must have suitable time ranges on at least as many days "
                f"as requested reservations per week. Counted {number_of_suitable_weekdays} but expected "
                f"at least {section.applied_reservations_per_week}."
            )
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_FEW)
            errors.append(error)

        # Check that each weekday has a contiguous time range long enough for an allocation.
        for weekday, timeslots in time_slots.items():
            for timeslot in timeslots:
                duration = time_difference(timeslot["begin_time"], timeslot["end_time"])
                if duration >= section.reservation_min_duration:
                    break

            else:  # no break
                minimum_duration = local_timedelta_string(section.reservation_min_duration)
                msg = (
                    f"Suitable time ranges for {weekday.label} in application section {section.pk} "
                    f"do not contain a contiguous time range that is at least as long as the "
                    f"requested minimum reservation duration of {minimum_duration}."
                )
                error = GraphQLValidationError(msg, code=error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_SHORT)
                errors.append(error)

    @classmethod
    def validate_applicant(cls, instance: Application, errors: ErrorList) -> None:
        """Validate applicant differently based on applicant type."""
        if instance.applicant_type is None:
            msg = "Application applicant type is required."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_APPLICANT_TYPE_MISSING)
            errors.append(error)
            return

        applicant_type = ReserveeType(instance.applicant_type)

        match applicant_type:
            case ReserveeType.INDIVIDUAL:
                cls.validate_individual_applicant(instance, errors)

            case ReserveeType.NONPROFIT:
                cls.validate_non_profit_applicant(instance, errors)

            case ReserveeType.COMPANY:
                cls.validate_company_applicant(instance, errors)

    @classmethod
    def validate_individual_applicant(cls, instance: Application, errors: ErrorList) -> None:
        cls.validate_contact_person(instance, errors)
        cls.validate_billing_address(instance, errors)

    @classmethod
    def validate_non_profit_applicant(cls, instance: Application, errors: ErrorList) -> None:
        cls.validate_contact_person(instance, errors)
        cls.validate_organisation(instance, errors, require_municipality=True)

    @classmethod
    def validate_company_applicant(cls, instance: Application, errors: ErrorList) -> None:
        cls.validate_contact_person(instance, errors)
        cls.validate_organisation(instance, errors, require_identifier=True)

    @classmethod
    def validate_billing_address(cls, instance: Application, errors: ErrorList) -> None:
        if not instance.billing_street_address:
            msg = "Application billing street address missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_STREET_ADDRESS_MISSING)
            errors.append(error)

        if not instance.billing_post_code:
            msg = "Application billing post code missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_POST_CODE_MISSING)
            errors.append(error)

        if not instance.billing_city:
            msg = "Application billing city missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_CITY_MISSING)
            errors.append(error)

    @classmethod
    def validate_contact_person(cls, instance: Application, errors: ErrorList) -> None:
        if not instance.contact_person_first_name:
            msg = "Application contact person first name missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_FIRST_NAME_MISSING)
            errors.append(error)

        if not instance.contact_person_last_name:
            msg = "Application contact person last name missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_LAST_NAME_MISSING)
            errors.append(error)

        if not instance.contact_person_email:
            msg = "Application contact person email address missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_EMAIL_MISSING)
            errors.append(error)

        if not instance.contact_person_phone_number:
            msg = "Application contact person phone number missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_PHONE_NUMBER_MISSING)
            errors.append(error)

    @classmethod
    def validate_organisation(
        cls,
        instance: Application,
        errors: ErrorList,
        *,
        require_municipality: bool = False,
        require_identifier: bool = False,
    ) -> None:
        if not instance.organisation_name:
            msg = "Application organisation must have a name."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_NAME_MISSING)
            errors.append(error)

        if not instance.organisation_core_business:
            msg = "Application organisation must have a core business."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_CORE_BUSINESS_MISSING)
            errors.append(error)

        if require_municipality and instance.municipality is None:
            msg = "Application municipality is required with organisation."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_MUNICIPALITY_MISSING)
            errors.append(error)

        if require_identifier and not instance.organisation_identifier:
            msg = "Application organisation must have an identifier."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_IDENTIFIER_MISSING)
            errors.append(error)

        if not instance.organisation_street_address:
            msg = "Application organisation street address missing."
            error = GraphQLValidationError(
                msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_STREET_ADDRESS_MISSING
            )
            errors.append(error)

        if not instance.organisation_post_code:
            msg = "Application organisation post code missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_POST_CODE_MISSING)
            errors.append(error)

        if not instance.organisation_city:
            msg = "Application organisation city missing."
            error = GraphQLValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_CITY_MISSING)
            errors.append(error)

        # Only validate billing address if applicant selected "use different billing address"
        # and thus filled out the billing address information.
        if not instance.billing_street_address and not instance.billing_post_code and not instance.billing_city:
            return

        cls.validate_billing_address(instance, errors)

    @classmethod
    def validate_user(cls, user: User, errors: ErrorList) -> None:
        try:
            user.validators.validate_is_of_age(code=error_codes.APPLICATION_ADULT_RESERVEE_REQUIRED)
        except GraphQLValidationError as error:
            errors.append(error)

        try:
            user.validators.validate_is_internal_user_if_ad_user()
        except GraphQLValidationError as error:
            errors.append(error)

    @classmethod
    def __after__(cls, instance: Application, info: GQLInfo[User], previous_data: dict[str, Any]) -> None:
        EmailService.send_seasonal_booking_application_received_email(application=instance)
