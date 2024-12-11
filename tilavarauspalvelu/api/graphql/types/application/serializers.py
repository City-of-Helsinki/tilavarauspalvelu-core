from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.settings import api_settings

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
    from tilavarauspalvelu.models import ApplicationSection, Organisation, User
    from tilavarauspalvelu.typing import AnyUser


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
            "applicant_type",
            "created_date",
            "last_modified_date",
            "cancelled_date",
            "sent_date",
            "additional_information",
            "application_round",
            "organisation",
            "contact_person",
            "user",
            "billing_address",
            "home_city",
            "application_sections",
            "status",
        ]
        extra_kwargs = {
            "home_city": {
                "required": False,
                "allow_null": True,
            },
        }

    def validate_user(self, user: User) -> User:
        if user.actions.is_ad_user or user.actions.is_of_age:
            return user

        msg = "Application can only be created by an adult reservee"
        raise ValidationError(msg, error_codes.APPLICATION_ADULT_RESERVEE_REQUIRED)


class ApplicationUpdateSerializer(ApplicationCreateSerializer):
    instance: Application

    class Meta(ApplicationCreateSerializer.Meta):
        fields = [*ApplicationCreateSerializer.Meta.fields, "working_memo"]

    def validate_working_memo(self, value: str) -> str:
        user: AnyUser = self.request_user
        if not user.permissions.can_view_application(self.instance, reserver_needs_role=True):
            msg = "No permission to access working memo."
            raise serializers.ValidationError(msg)

        return value


class ApplicationSendSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: defaultdict[str, list[str]] = defaultdict(list)

        self.validate_application_sections(errors)
        self.validate_applicant(errors)

        status = self.instance.status
        if not status.can_send:
            msg = f"Application in status '{status.value}' cannot be sent."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def validate_application_sections(self, errors: defaultdict[str, list[str]]) -> None:
        """Validate section and related data that has not been validated by database constraints."""
        sections = self.instance.application_sections.all()

        if not sections:
            msg = "Application requires application sections before it can be sent."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)
            return

        for section in sections:
            if not section.name:
                msg = f"Application section {section.pk} name cannot be empty."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if section.num_persons < 1:
                msg = f"Application section {section.pk} must be for at least one person."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if section.age_group is None:
                msg = f"Application section {section.pk} must have age group set."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if section.purpose is None:
                msg = f"Application section {section.pk} must have its purpose set."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            self.validate_suitable_time_ranges(section, errors)

            number_of_reservation_unit_options = section.reservation_unit_options.count()
            if number_of_reservation_unit_options < 1:
                msg = f"Application section {section.pk} must have at least one reservation unit option selected."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_suitable_time_ranges(self, section: ApplicationSection, errors: defaultdict[str, list[str]]) -> None:
        time_ranges = section.suitable_time_ranges.all()

        if not time_ranges:
            msg = f"Application section {section.pk} must have at least one suitable time range selected."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)
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
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

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
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_applicant(self, errors: defaultdict[str, list[str]]) -> None:
        """Validate applicant differently based on applicant type."""
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

    def validate_individual_applicant(self, errors: defaultdict[str, list[str]]) -> None:
        self.validate_contact_person(errors)
        self.validate_billing_address(errors)

    def validate_community_applicant(self, errors: defaultdict[str, list[str]]) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_home_city=True)

    def validate_association_applicant(self, errors: defaultdict[str, list[str]]) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_home_city=True)

    def validate_company_applicant(self, errors: defaultdict[str, list[str]]) -> None:
        self.validate_contact_person(errors)
        self.validate_organisation(errors, require_identifier=True)

    def validate_billing_address(self, errors: defaultdict[str, list[str]]) -> None:
        if self.instance.billing_address is None:
            msg = "Application billing address is required."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        else:
            if not self.instance.billing_address.street_address:
                msg = "Application billing address must have a street address."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not self.instance.billing_address.post_code:
                msg = "Application billing address must have a post code."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not self.instance.billing_address.city:
                msg = "Application billing address must have a city."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_contact_person(self, errors: defaultdict[str, list[str]]) -> None:
        if self.instance.contact_person is None:
            msg = "Application contact person is required."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        else:
            if not self.instance.contact_person.first_name:
                msg = "Application contact person must have a first name."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not self.instance.contact_person.last_name:
                msg = "Application contact person must have a last name."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not self.instance.contact_person.email:
                msg = "Application contact person must have an email address."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not self.instance.contact_person.phone_number:
                msg = "Application contact person must have a phone number."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_organisation(
        self,
        errors: defaultdict[str, list[str]],
        *,
        require_home_city: bool = False,
        require_identifier: bool = False,
    ) -> None:
        organisation = self.instance.organisation

        if organisation is None:
            msg = "Application organisation is required."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        else:
            if not organisation.name:
                msg = "Application organisation must have a name."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not organisation.core_business:
                msg = "Application organisation must have a core business."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if require_home_city and self.instance.home_city is None:
                msg = "Application home city is required with organisation."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if require_identifier and organisation.identifier is None:
                msg = "Application organisation must have an identifier."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            self.validate_organisation_address(organisation, errors)

    def validate_organisation_address(self, organisation: Organisation, errors: defaultdict[str, list[str]]) -> None:
        if organisation.address is None:
            msg = "Application organisation address is required."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        else:
            if not organisation.address.street_address:
                msg = "Application organisation address must have a street address."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not organisation.address.post_code:
                msg = "Application organisation address must have a post code."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            if not organisation.address.city:
                msg = "Application organisation address must have a city."
                errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

            # Only validate billing address if applicant selected "use different billing address"
            # and thus filled out the billing address information.
            if self.instance.billing_address is not None:
                self.validate_billing_address(errors)

    def save(self, **kwargs: Any) -> Application:
        self.instance.sent_date = local_datetime()
        self.instance.save()
        EmailService.send_application_received_email(application=self.instance)
        return self.instance


class ApplicationCancelSerializer(NestingModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        status = self.instance.status
        if not status.can_cancel:
            msg = f"Application in status '{status.value}' cannot be cancelled."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def save(self, **kwargs: Any) -> Application:
        self.instance.cancelled_date = local_datetime()
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
