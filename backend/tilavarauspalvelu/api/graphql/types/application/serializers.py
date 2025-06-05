from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import IntegerPrimaryKeyField
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.api.graphql.types.address.serializers import AddressSerializer
from tilavarauspalvelu.api.graphql.types.application_section.serializers import (
    ApplicationSectionForApplicationSerializer,
)
from tilavarauspalvelu.api.graphql.types.organisation.serializers import OrganisationSerializer
from tilavarauspalvelu.api.graphql.types.person.serializers import PersonSerializer
from tilavarauspalvelu.enums import ApplicantTypeChoice, ApplicationStatusChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import AllocatedTimeSlot, Application, ReservationUnitOption
from utils.date_utils import TimeSlot, local_datetime, local_timedelta_string, merge_time_slots, time_difference
from utils.fields.serializer import CurrentUserDefaultNullable

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound, ApplicationSection, Organisation, User
    from tilavarauspalvelu.typing import ErrorList


__all__ = [
    "ApplicationCancelSerializer",
    "ApplicationCreateSerializer",
    "ApplicationSendSerializer",
    "ApplicationUpdateSerializer",
    "ApplicationWorkingMemoSerializer",
    "RejectAllApplicationOptionsSerializer",
    "RestoreAllApplicationOptionsSerializer",
]


class ApplicationCreateSerializer(NestingModelSerializer):
    instance: None

    organisation = OrganisationSerializer(required=False, allow_null=True)
    contact_person = PersonSerializer(required=False, allow_null=True)
    user = serializers.HiddenField(default=CurrentUserDefaultNullable())
    application_sections = ApplicationSectionForApplicationSerializer(required=False, many=True)
    billing_address = AddressSerializer(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=ApplicationStatusChoice.choices, read_only=True)

    class Meta:
        model = Application
        fields = [
            "pk",
            "application_round",
            "applicant_type",
            "additional_information",
            "organisation",
            "contact_person",
            "billing_address",
            "home_city",
            "application_sections",
            # Read-only
            "user",
            "created_at",
            "updated_at",
            "cancelled_at",
            "sent_at",
            "status",
        ]
        extra_kwargs = {
            "home_city": {"required": False, "allow_null": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "cancelled_at": {"read_only": True},
            "sent_at": {"read_only": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        user: User = data["user"]
        user.validators.validate_is_of_age()
        user.validators.validate_is_internal_user_if_ad_user()

        application_round: ApplicationRound = data["application_round"]
        application_round.validators.validate_open_for_applications()

        section_count = len(data.get("application_sections", []))
        Application.validators.validate_not_too_many_sections(section_count)

        return data


class ApplicationUpdateSerializer(ApplicationCreateSerializer):
    instance: Application

    user = IntegerPrimaryKeyField(read_only=True)

    class Meta(ApplicationCreateSerializer.Meta):
        extra_kwargs = {
            **ApplicationCreateSerializer.Meta.extra_kwargs,
            "application_round": {"read_only": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        application_round = self.instance.application_round
        application_round.validators.validate_open_for_applications()

        section_count = len(data.get("application_sections", []))
        Application.validators.validate_not_too_many_sections(section_count)

        return data

    def update(self, instance: Application, validated_data: dict[str, Any]) -> Application:
        # If a sent application is updated, it needs to be sent and validated again
        instance.sent_at = None
        return super().update(instance, validated_data)


class ApplicationWorkingMemoSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
            "working_memo",
        ]


class ApplicationSendSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: ErrorList = []

        self.validate_application_sections(errors)
        self.validate_applicant(errors)
        self.validate_user(self.instance.user, errors)

        status = self.instance.status
        if not status.can_send:
            msg = f"Application in status '{status.value}' cannot be sent."
            error = ValidationError(msg, code=error_codes.APPLICATION_STATUS_CANNOT_SEND)
            errors.append(error)

        if errors:
            details = [detail for error in errors for detail in error.detail]
            raise serializers.ValidationError(details)

        return data

    def validate_application_sections(self, errors: ErrorList) -> None:
        """Validate section and related data that has not been validated by database constraints."""
        sections = self.instance.application_sections.all()

        if not sections:
            msg = "Application requires application sections before it can be sent."
            error = ValidationError(msg, code=error_codes.APPLICATION_SECTIONS_MISSING)
            errors.append(error)
            return

        for section in sections:
            if not section.name:
                msg = f"Application section {section.pk} name cannot be empty."
                error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_EMPTY_NAME)
                errors.append(error)

            if section.num_persons < 1:
                msg = f"Application section {section.pk} must be for at least one person."
                error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_NUM_PERSONS_ZERO)
                errors.append(error)

            if section.age_group is None:
                msg = f"Application section {section.pk} must have age group set."
                error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_AGE_GROUP_MISSING)
                errors.append(error)

            if section.purpose is None:
                msg = f"Application section {section.pk} must have its purpose set."
                error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_PURPOSE_MISSING)
                errors.append(error)

            self.validate_suitable_time_ranges(section, errors)

            number_of_reservation_unit_options = section.reservation_unit_options.count()
            if number_of_reservation_unit_options < 1:
                msg = f"Application section {section.pk} must have at least one reservation unit option selected."
                error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_RESERVATION_UNIT_OPTIONS_MISSING)
                errors.append(error)

    def validate_suitable_time_ranges(self, section: ApplicationSection, errors: ErrorList) -> None:
        time_ranges = section.suitable_time_ranges.all()

        if not time_ranges:
            msg = f"Application section {section.pk} must have at least one suitable time range selected."
            error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGES_MISSING)
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
            error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_FEW)
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
                error = ValidationError(msg, code=error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_SHORT)
                errors.append(error)

    def validate_applicant(self, errors: ErrorList) -> None:
        """Validate applicant differently based on applicant type."""
        if self.instance.applicant_type is None:
            msg = "Application applicant type is required."
            error = ValidationError(msg, code=error_codes.APPLICATION_APPLICANT_TYPE_MISSING)
            errors.append(error)
            return

        applicant_type = ApplicantTypeChoice(self.instance.applicant_type)

        match applicant_type:
            case ApplicantTypeChoice.INDIVIDUAL:
                self.validate_individual_applicant(errors)

            case ApplicantTypeChoice.COMMUNITY:
                self.validate_community_applicant(errors)

            case ApplicantTypeChoice.ASSOCIATION:
                self.validate_association_applicant(errors)

            case ApplicantTypeChoice.COMPANY:
                self.validate_company_applicant(errors)

    def validate_individual_applicant(self, errors: ErrorList) -> None:
        self.validate_contact_person(errors)
        self.validate_billing_address(errors)

    def validate_community_applicant(self, errors: ErrorList) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_home_city=True)

    def validate_association_applicant(self, errors: ErrorList) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_home_city=True)

    def validate_company_applicant(self, errors: ErrorList) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_identifier=True)

    def validate_billing_address(self, errors: ErrorList) -> None:
        if self.instance.billing_address is None:
            msg = "Application billing address is required."
            error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_MISSING)
            errors.append(error)

        else:
            if not self.instance.billing_address.street_address:
                msg = "Application billing address must have a street address."
                error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_STREET_ADDRESS_MISSING)
                errors.append(error)

            if not self.instance.billing_address.post_code:
                msg = "Application billing address must have a post code."
                error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_POST_CODE_MISSING)
                errors.append(error)

            if not self.instance.billing_address.city:
                msg = "Application billing address must have a city."
                error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_CITY_MISSING)
                errors.append(error)

    def validate_contact_person(self, errors: ErrorList) -> None:
        if self.instance.contact_person is None:
            msg = "Application contact person is required."
            error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_MISSING)
            errors.append(error)

        else:
            if not self.instance.contact_person.first_name:
                msg = "Application contact person must have a first name."
                error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_FIRST_NAME_MISSING)
                errors.append(error)

            if not self.instance.contact_person.last_name:
                msg = "Application contact person must have a last name."
                error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_LAST_NAME_MISSING)
                errors.append(error)

            if not self.instance.contact_person.email:
                msg = "Application contact person must have an email address."
                error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_EMAIL_MISSING)
                errors.append(error)

            if not self.instance.contact_person.phone_number:
                msg = "Application contact person must have a phone number."
                error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_PHONE_NUMBER_MISSING)
                errors.append(error)

    def validate_organisation(
        self,
        errors: ErrorList,
        *,
        require_home_city: bool = False,
        require_identifier: bool = False,
    ) -> None:
        organisation = self.instance.organisation

        if organisation is None:
            msg = "Application organisation is required."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_MISSING)
            errors.append(error)

        else:
            if not organisation.name:
                msg = "Application organisation must have a name."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_NAME_MISSING)
                errors.append(error)

            if not organisation.core_business:
                msg = "Application organisation must have a core business."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_CORE_BUSINESS_MISSING)
                errors.append(error)

            if require_home_city and self.instance.home_city is None:
                msg = "Application home city is required with organisation."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_HOME_CITY_MISSING)
                errors.append(error)

            if require_identifier and organisation.identifier is None:
                msg = "Application organisation must have an identifier."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_IDENTIFIER_MISSING)
                errors.append(error)

            self.validate_organisation_address(organisation, errors)

    def validate_organisation_address(self, organisation: Organisation, errors: ErrorList) -> None:
        if organisation.address is None:
            msg = "Application organisation address is required."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_MISSING)
            errors.append(error)

        else:
            if not organisation.address.street_address:
                msg = "Application organisation address must have a street address."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_STREET_ADDRESS_MISSING)
                errors.append(error)

            if not organisation.address.post_code:
                msg = "Application organisation address must have a post code."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_POST_CODE_MISSING)
                errors.append(error)

            if not organisation.address.city:
                msg = "Application organisation address must have a city."
                error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_CITY_MISSING)
                errors.append(error)

            # Only validate billing address if applicant selected "use different billing address"
            # and thus filled out the billing address information.
            if self.instance.billing_address is not None:
                self.validate_billing_address(errors)

    def validate_user(self, user: User, errors: ErrorList) -> None:
        try:
            user.validators.validate_is_of_age(code=error_codes.APPLICATION_ADULT_RESERVEE_REQUIRED)
        except ValidationError as error:
            errors.append(error)

        try:
            user.validators.validate_is_internal_user_if_ad_user()
        except ValidationError as error:
            errors.append(error)

    def save(self, **kwargs: Any) -> Application:
        self.instance.sent_at = local_datetime()
        self.instance.save()
        EmailService.send_seasonal_booking_application_received_email(application=self.instance)
        return self.instance


class ApplicationCancelSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: ErrorList = []

        status = self.instance.status
        if not status.can_cancel:
            msg = f"Application in status '{status.value}' cannot be cancelled."
            error = ValidationError(msg, code=error_codes.APPLICATION_STATUS_CANNOT_CANCEL)
            errors.append(error)

        if errors:
            details = [detail for error in errors for detail in error.detail]
            raise serializers.ValidationError(details)

        return data

    def save(self, **kwargs: Any) -> Application:
        self.instance.cancelled_at = local_datetime()
        self.instance.save()
        return self.instance


class RejectAllApplicationOptionsSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        slots_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application=self.instance,
        ).exists()

        if slots_exist:
            msg = "Application has allocated time slots and cannot be rejected."
            raise ValidationError(msg, code=error_codes.CANNOT_REJECT_APPLICATION_OPTIONS)

        return data

    def save(self, **kwargs: Any) -> Application:
        ReservationUnitOption.objects.filter(application_section__application=self.instance).update(rejected=True)
        return self.instance


class RestoreAllApplicationOptionsSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
        ]

    def save(self, **kwargs: Any) -> Application:
        ReservationUnitOption.objects.filter(application_section__application=self.instance).update(rejected=False)
        return self.instance
