from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import IntegerPrimaryKeyField
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.api.graphql.types.application_section.serializers import (
    ApplicationSectionForApplicationSerializer,
)
from tilavarauspalvelu.enums import ApplicantTypeChoice, ApplicationStatusChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import AllocatedTimeSlot, Application, ReservationUnitOption
from utils.date_utils import TimeSlot, local_datetime, local_timedelta_string, merge_time_slots, time_difference
from utils.fields.serializer import CurrentUserDefaultNullable

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound, ApplicationSection, User
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

    user = serializers.HiddenField(default=CurrentUserDefaultNullable())

    application_sections = ApplicationSectionForApplicationSerializer(required=False, many=True)

    status = serializers.ChoiceField(choices=ApplicationStatusChoice.choices, read_only=True)

    class Meta:
        model = Application
        fields = [
            "pk",
            "application_round",
            "application_sections",
            #
            # Basic information
            "applicant_type",
            "additional_information",
            #
            # Contact person
            "contact_person_first_name",
            "contact_person_last_name",
            "contact_person_email",
            "contact_person_phone_number",
            #
            # Billing address
            "billing_street_address",
            "billing_post_code",
            "billing_city",
            #
            # Organisation
            "organisation_name",
            "organisation_email",
            "organisation_identifier",
            "organisation_year_established",
            "organisation_active_members",
            "organisation_core_business",
            "organisation_street_address",
            "organisation_post_code",
            "organisation_city",
            "municipality",
            #
            # Read-only
            "user",
            "created_at",
            "updated_at",
            "cancelled_at",
            "sent_at",
            "status",
        ]
        extra_kwargs = {
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
        self.validate_organisation(errors, require_municipality=True)

    def validate_association_applicant(self, errors: ErrorList) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_municipality=True)

    def validate_company_applicant(self, errors: ErrorList) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_identifier=True)

    def validate_billing_address(self, errors: ErrorList) -> None:
        if not self.instance.billing_street_address:
            msg = "Application billing street address missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_STREET_ADDRESS_MISSING)
            errors.append(error)

        if not self.instance.billing_post_code:
            msg = "Application billing post code missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_POST_CODE_MISSING)
            errors.append(error)

        if not self.instance.billing_city:
            msg = "Application billing city missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_BILLING_ADDRESS_CITY_MISSING)
            errors.append(error)

    def validate_contact_person(self, errors: ErrorList) -> None:
        if not self.instance.contact_person_first_name:
            msg = "Application contact person first name missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_FIRST_NAME_MISSING)
            errors.append(error)

        if not self.instance.contact_person_last_name:
            msg = "Application contact person last name missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_LAST_NAME_MISSING)
            errors.append(error)

        if not self.instance.contact_person_email:
            msg = "Application contact person email address missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_EMAIL_MISSING)
            errors.append(error)

        if not self.instance.contact_person_phone_number:
            msg = "Application contact person phone number missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_CONTACT_PERSON_PHONE_NUMBER_MISSING)
            errors.append(error)

    def validate_organisation(
        self,
        errors: ErrorList,
        *,
        require_municipality: bool = False,
        require_identifier: bool = False,
    ) -> None:
        if not self.instance.organisation_name:
            msg = "Application organisation must have a name."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_NAME_MISSING)
            errors.append(error)

        if not self.instance.organisation_core_business:
            msg = "Application organisation must have a core business."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_CORE_BUSINESS_MISSING)
            errors.append(error)

        if require_municipality and self.instance.municipality is None:
            msg = "Application municipality is required with organisation."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_MUNICIPALITY_MISSING)
            errors.append(error)

        if require_identifier and not self.instance.organisation_identifier:
            msg = "Application organisation must have an identifier."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_IDENTIFIER_MISSING)
            errors.append(error)

        if not self.instance.organisation_street_address:
            msg = "Application organisation street address missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_STREET_ADDRESS_MISSING)
            errors.append(error)

        if not self.instance.organisation_post_code:
            msg = "Application organisation post code missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_POST_CODE_MISSING)
            errors.append(error)

        if not self.instance.organisation_city:
            msg = "Application organisation city missing."
            error = ValidationError(msg, code=error_codes.APPLICATION_ORGANISATION_ADDRESS_CITY_MISSING)
            errors.append(error)

        # Only validate billing address if applicant selected "use different billing address"
        # and thus filled out the billing address information.
        if (
            not self.instance.billing_street_address
            and not self.instance.billing_post_code
            and not self.instance.billing_city
        ):
            return

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
        ReservationUnitOption.objects.filter(application_section__application=self.instance).update(is_rejected=True)
        return self.instance


class RestoreAllApplicationOptionsSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
        ]

    def save(self, **kwargs: Any) -> Application:
        ReservationUnitOption.objects.filter(application_section__application=self.instance).update(is_rejected=False)
        return self.instance
