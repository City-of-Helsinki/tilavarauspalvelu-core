from datetime import datetime
from typing import Union

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.reservation_units_api import ReservationUnitSerializer
from api.reservations_api import AgeGroupSerializer
from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventScheduleResult,
    ApplicationEventStatus,
    ApplicationEventWeeklyAmountReduction,
    ApplicationRound,
    ApplicationStatus,
    City,
    EventReservationUnit,
    Organisation,
    Person,
    Recurrence,
)
from applications.utils.reservation_creation import (
    create_reservations_from_allocation_results,
)
from permissions.helpers import can_handle_application
from reservation_units.models import ReservationUnit
from reservations.models import AbilityGroup, AgeGroup, ReservationPurpose

MINIMUM_TIME = timezone.datetime(
    1970, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)

MAXIMUM_TIME = timezone.datetime(
    2099, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)


class AddressSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = Address

        fields = ["id", "street_address", "post_code", "city"]


class OrganisationSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(allow_null=True, required=False)
    address = AddressSerializer(
        help_text="Address object of this organisation",
        read_only=False,
        allow_null=False,
    )
    identifier = serializers.CharField(allow_null=True)

    class Meta:
        model = Organisation
        fields = [
            "id",
            "name",
            "identifier",
            "year_established",
            "active_members",
            "organisation_type",
            "core_business",
            "email",
            "address",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Official name of the organisation",
            },
            "identifier": {
                "help_text": "Identifier of the organisation. Finnish y-tunnus.",
            },
            "year_established": {
                "help_text": "Year when the organisation was established.",
            },
            "active_members": {
                "help_text": "Number of active persons in the organization.",
            },
        }

    def handle_address(self, address_data) -> Union[Address, None]:
        if address_data is None:
            return None
        elif "id" not in address_data or address_data["id"] is None:
            address = AddressSerializer(data=address_data).create(
                validated_data=address_data
            )
        else:
            address = AddressSerializer(data=address_data).update(
                instance=Address.objects.get(pk=address_data["id"]),
                validated_data=address_data,
            )
        return address

    def create(self, validated_data):
        address_data = validated_data.pop("address")
        validated_data["address"] = self.handle_address(address_data=address_data)
        organisation = super().create(validated_data)
        return organisation

    def update(self, instance, validated_data):
        address_data = validated_data.pop("address")
        validated_data["address"] = self.handle_address(address_data=address_data)
        organisation = super().update(instance, validated_data)
        return organisation


class PersonSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = Person
        fields = ["id", "first_name", "last_name", "email", "phone_number"]


# TODO: Should move to using serializers.CurrentUserDefault when we have actual security in place.
#  Now you can call stuff without authenticating and it'll fail with nasty AnonymousUser error,
#  if not setting user to None instead.
class NullableCurrentUserDefault(object):
    def __init__(self):
        self.user = None

    def set_context(self, serializer_field):
        user = self.user = serializer_field.context["request"].user

        if user.is_authenticated:
            self.user = user
        else:
            self.user = None

    def __call__(self):
        return self.user

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class ApplicationEventScheduleSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = ApplicationEventSchedule
        fields = ["id", "day", "begin", "end"]
        extra_kwargs = {
            "day": {
                "help_text": "Day of requested reservation allocation time slot for event represented as number. "
                "0 = monday, 6 = sunday.",
            },
            "begin": {
                "help_text": "Begin time of requested reservation allocation slot.",
            },
            "end": {
                "help_text": "End time of requested reservation allocation slot.",
            },
        }


class DateAwareRecurrenceReadSerializer(serializers.ModelSerializer):

    recurrence = serializers.SerializerMethodField()

    def get_recurrence(self, instance):
        return instance.recurrence.between(self.get_start_date(), self.get_end_date())

    def get_start_date(self) -> datetime:
        if "start" in self.context and self.context["start"] is not None:
            return self.context["start"]
        return MINIMUM_TIME

    def get_end_date(self) -> datetime:
        if "end" in self.context and self.context["end"] is not None:
            return self.context["end"]
        return MAXIMUM_TIME

    class Meta:
        model = Recurrence
        fields = ["id", "priority", "recurrence"]


class EventReservationUnitSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(allow_null=True, required=False)
    reservation_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ReservationUnit.objects.all(),
        source="reservation_unit",
        help_text="Id of the reservation unit requested for the event.",
    )
    reservation_unit_details = ReservationUnitSerializer(
        display=True, source="reservation_unit", read_only=True
    )

    class Meta:
        model = EventReservationUnit
        fields = [
            "id",
            "priority",
            "reservation_unit_id",
            "reservation_unit_details",
        ]
        extra_kwargs = {
            "priority": {
                "help_text": "Priority of this reservation unit for the event. Lower the number, higher the priority.",
            },
        }


class ApplicationEventSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(allow_null=True, required=False)

    application_event_schedules = ApplicationEventScheduleSerializer(
        many=True, read_only=False
    )

    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(),
        source="application",
        help_text="Id of the applications to which this single application event is targeted to.",
    )

    age_group_id = serializers.PrimaryKeyRelatedField(
        queryset=AgeGroup.objects.all(),
        source="age_group",
        allow_null=True,
        help_text="Id of the age group for this event.",
    )

    age_group_display = AgeGroupSerializer(
        display=True, read_only=True, source="age_group"
    )

    ability_group_id = serializers.PrimaryKeyRelatedField(
        queryset=AbilityGroup.objects.all(),
        source="ability_group",
        allow_null=True,
        help_text="Id of the ability group for this event.",
    )

    ability_group = serializers.SerializerMethodField(
        method_name="get_ability_group_name",
        help_text="Ability group name of this event",
    )

    purpose_id = serializers.PrimaryKeyRelatedField(
        queryset=ReservationPurpose.objects.all(),
        source="purpose",
        allow_null=True,
        help_text="Id of the use purpose for this event.",
    )

    purpose = serializers.SerializerMethodField(
        method_name="get_purpose_name",
        help_text="Use purpose value of this event",
    )

    event_reservation_units = EventReservationUnitSerializer(
        many=True,
        read_only=False,
        required=False,
        help_text="List of reservation units applied for this event with priority included.",
    )

    status = serializers.ChoiceField(
        help_text="Status of this application event",
        choices=ApplicationEventStatus.STATUS_CHOICES,
    )

    weekly_amount_reductions_count = serializers.SerializerMethodField()

    declined_reservation_unit_ids = serializers.PrimaryKeyRelatedField(
        source="declined_reservation_units", many=True, read_only=True
    )

    aggregated_data = serializers.DictField(
        source="aggregated_data_dict", read_only=True
    )

    uuid = serializers.UUIDField(read_only=True)

    class Meta:
        model = ApplicationEvent
        fields = [
            "id",
            "name",
            "application_event_schedules",
            "num_persons",
            "age_group_display",
            "age_group_id",
            "ability_group_id",
            "ability_group",
            "min_duration",
            "max_duration",
            "application_id",
            "events_per_week",
            "biweekly",
            "begin",
            "end",
            "purpose_id",
            "purpose",
            "event_reservation_units",
            "status",
            "declined_reservation_unit_ids",
            "weekly_amount_reductions_count",
            "aggregated_data",
            "uuid",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this event.",
            },
            "num_persons": {
                "help_text": "Number of persons that are excepted to attend this event.",
            },
            "min_duration": {
                "help_text": "Minimum duration of reservations allocated for this event.",
            },
            "max_duration": {
                "help_text": "Maximum duration of reservations allocated for this event.",
            },
            "events_per_week": {
                "help_text": "Number of reservations requested for each week "
                "(or every other week if biweekly is true).",
            },
            "biweekly": {
                "help_text": "False if recurring reservations are wished for every week. "
                "True if only every other week.",
            },
            "begin": {
                "help_text": "Requested begin date of the recurring reservation for this event.",
            },
            "end": {
                "help_text": "Requested end date of the recurring reservation for this event.",
            },
        }

    def get_weekly_amount_reductions_count(self, obj):
        return obj.weekly_amount_reductions.count()

    def get_purpose_name(self, obj):
        if obj.purpose:
            return obj.purpose.name

    def get_ability_group_name(self, obj):
        if obj.ability_group:
            return obj.ability_group.name

    def validate(self, data):
        min_duration = data["min_duration"]
        max_duration = data["max_duration"]

        if max_duration is not None and max_duration < min_duration:
            raise serializers.ValidationError(
                "Maximum duration should be larger than minimum duration"
            )
        return data

    @staticmethod
    def handle_event_schedules(schedule_data, application_event):
        event_ids = []
        for schedule in schedule_data:
            f = ApplicationEventSchedule(
                **schedule, application_event=application_event
            )
            f.save()
            event_ids.append(f.id)
        ApplicationEventSchedule.objects.filter(
            application_event=application_event
        ).exclude(id__in=event_ids).delete()

    @staticmethod
    def handle_units(event_unit_data, application_event):
        event_unit_ids = []
        for event_unit in event_unit_data:
            f = EventReservationUnit(**event_unit, application_event=application_event)
            f.save()
            event_unit_ids.append(f.id)
        EventReservationUnit.objects.filter(
            application_event=application_event
        ).exclude(id__in=event_unit_ids).delete()

    def create(self, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )
        schedule_data = validated_data.pop("application_event_schedules")
        unit_data = validated_data.pop("event_reservation_units")
        status = validated_data.pop("status")

        event = super().create(validated_data)
        self.handle_event_schedules(
            schedule_data=schedule_data, application_event=event
        )

        self.handle_units(event_unit_data=unit_data, application_event=event)
        event.set_status(status, request_user)

        return event

    def update(self, instance, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )
        schedule_data = validated_data.pop("application_event_schedules")
        unit_data = validated_data.pop("event_reservation_units")
        status = validated_data.pop("status")

        event = super().update(instance, validated_data)
        self.handle_event_schedules(schedule_data, instance)

        self.handle_units(event_unit_data=unit_data, application_event=instance)

        event.set_status(status, request_user)
        return instance


class ApplicationSerializer(serializers.ModelSerializer):

    contact_person = PersonSerializer(
        help_text="Contact person information for the application",
        read_only=False,
        allow_null=True,
    )

    organisation = OrganisationSerializer(
        help_text="Organisation information for the application",
        read_only=False,
        allow_null=True,
    )

    application_round_id = serializers.PrimaryKeyRelatedField(
        queryset=ApplicationRound.objects.all(),
        source="application_round",
        help_text="Id of the application period for which this application is targeted to",
    )

    user = serializers.HiddenField(default=NullableCurrentUserDefault())

    application_events = ApplicationEventSerializer(
        help_text="List of applications events", many=True
    )

    status = serializers.ChoiceField(
        help_text="Status of this application", choices=ApplicationStatus.STATUS_CHOICES
    )

    aggregated_data = serializers.DictField(
        source="aggregated_data_dict", read_only=True
    )

    billing_address = AddressSerializer(
        help_text="Billing address for the application",
        allow_null=True,
    )

    applicant_type = serializers.CharField(allow_null=True)

    applicant_id = serializers.PrimaryKeyRelatedField(source="user", read_only=True)
    applicant_name = serializers.CharField(source="user.get_full_name", read_only=True)
    applicant_email = serializers.EmailField(source="user.email", read_only=True)

    home_city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source="home_city", required=False, allow_null=True
    )

    created_date = serializers.DateTimeField(read_only=True)
    last_modified_date = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "applicant_type",
            "applicant_id",
            "applicant_name",
            "applicant_email",
            "organisation",
            "application_round_id",
            "contact_person",
            "user",
            "application_events",
            "status",
            "aggregated_data",
            "billing_address",
            "home_city_id",
            "created_date",
            "last_modified_date",
        ]

    def set_home_city(self, obj: Application):
        if obj.home_city is not None:
            return City.objects.get(name=obj.home_city.name).name
        return None

    def get_home_city(self, obj: Application):
        if obj.home_city is not None:
            return City.objects.get(name=obj.home_city.name).name
        return None

    @staticmethod
    def handle_person(contact_person_data) -> Union[Person, None]:
        person = None
        if contact_person_data is not None:
            if "id" not in contact_person_data or contact_person_data["id"] is None:
                person = PersonSerializer(data=contact_person_data).create(
                    validated_data=contact_person_data
                )
            else:
                person = PersonSerializer(data=contact_person_data).update(
                    instance=Person.objects.get(pk=contact_person_data["id"]),
                    validated_data=contact_person_data,
                )
        return person

    def handle_organisation(self, organisation_data) -> Union[Organisation, None]:
        if organisation_data is None:
            return None
        elif "id" not in organisation_data or organisation_data["id"] is None:
            organisation = OrganisationSerializer(data=organisation_data).create(
                validated_data=organisation_data
            )
        else:
            organisation = OrganisationSerializer(data=organisation_data).update(
                instance=Organisation.objects.get(pk=organisation_data["id"]),
                validated_data=organisation_data,
            )
        return organisation

    def validate(self, data):
        # Validations when user submits application for review
        if "status" in data and data["status"] == ApplicationStatus.IN_REVIEW:
            data = self.validate_for_review(data)
        if (
            self.instance
            and self.instance.status
            in (ApplicationStatus.DRAFT, ApplicationStatus.IN_REVIEW)
            and "status" in data
            and data["status"] == ApplicationStatus.SENT
        ):
            raise serializers.ValidationError(
                "Applications in DRAFT or IN_REVIEW status cannot set as SENT."
            )
        if "status" in data and data["status"] not in (
            ApplicationStatus.DRAFT,
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.CANCELLED,
        ):
            request = self.context["request"] if "request" in self.context else None
            request_user = (
                request.user if request and request.user.is_authenticated else None
            )
            if not can_handle_application(request_user, self.instance):
                raise serializers.ValidationError("No permission for status change.")

        return data

    def validate_for_review(self, data):
        application_events = data.get("application_events", [])
        if not len(application_events):
            raise ValidationError(_("Application must have application events"))
        else:
            contact_person_info = data.get("contact_person", None)
            if not contact_person_info or contact_person_info == "":
                raise serializers.ValidationError(
                    "Contact person is required for review."
                )
            for event in application_events:
                if not len(event["application_event_schedules"]):
                    raise ValidationError(_("Application events must have schedules"))

                for field in ApplicationEvent.REQUIRED_FOR_REVIEW:
                    if event.get(field, None) in [None, ""]:
                        raise ValidationError(
                            _(
                                'Field "{field}" is required for application event.'
                            ).format(field=field)
                        )

        contact_person = data.get("contact_person", None)
        if not contact_person:
            raise ValidationError(_("Application must have contact person"))
        else:
            for field in Person.REQUIRED_FOR_REVIEW:
                if contact_person.get(field, None) in [None, ""]:
                    raise ValidationError(
                        _('Field "{field}" is required for contact person.').format(
                            field=field
                        )
                    )

        return data

    def handle_events(self, application_instance, event_data):
        if event_data is None:
            return
        event_ids = []
        for event in event_data:
            event["application"] = application_instance
            if "id" not in event or event["id"] is None:
                event_ids.append(
                    ApplicationEventSerializer(data=event)
                    .create(validated_data=event)
                    .id
                )
            else:
                event_ids.append(
                    ApplicationEventSerializer(data=event)
                    .update(
                        instance=ApplicationEvent.objects.get(pk=event["id"]),
                        validated_data=event,
                    )
                    .id
                )
        ApplicationEvent.objects.filter(application=application_instance).exclude(
            id__in=event_ids
        ).delete()

    def create(self, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

        billing_address_data = validated_data.pop("billing_address")
        if billing_address_data:
            billing_address = Address.objects.create(**billing_address_data)
            validated_data["billing_address"] = billing_address

        status = validated_data.pop("status")

        contact_person_data = validated_data.pop("contact_person")
        validated_data["contact_person"] = self.handle_person(
            contact_person_data=contact_person_data
        )

        organisation_data = validated_data.pop("organisation")
        validated_data["organisation"] = self.handle_organisation(
            organisation_data=organisation_data
        )

        event_data = validated_data.pop("application_events")

        app = super().create(validated_data)

        self.handle_events(application_instance=app, event_data=event_data)

        app.set_status(status, request_user)

        return app

    def update(self, instance, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

        billing_address_data = validated_data.pop("billing_address", None)
        if billing_address_data:
            if "id" not in billing_address_data or billing_address_data["id"] is None:
                billing_address = AddressSerializer(data=billing_address_data).create(
                    validated_data=billing_address_data
                )
            else:
                billing_address = AddressSerializer(data=billing_address_data).update(
                    instance=Address.objects.get(pk=billing_address_data["id"]),
                    validated_data=billing_address_data,
                )
            validated_data["billing_address"] = billing_address

        status = validated_data.pop("status", None)

        contact_person_data = validated_data.pop("contact_person", None)

        validated_data["contact_person"] = self.handle_person(
            contact_person_data=contact_person_data
        )

        organisation_data = validated_data.pop("organisation", None)
        validated_data["organisation"] = self.handle_organisation(
            organisation_data=organisation_data
        )

        event_data = validated_data.pop("application_events", None)

        self.handle_events(application_instance=instance, event_data=event_data)

        app = super().update(instance, validated_data)

        if status is not None:
            app.set_status(status, request_user)

        return app


class ApplicationStatusSerializer(serializers.ModelSerializer):
    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(), source="application"
    )
    user_id = serializers.PrimaryKeyRelatedField(source="user", read_only=True)

    class Meta:
        model = ApplicationStatus
        fields = [
            "status",
            "application_id",
            "user_id",
            "timestamp",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        instance = ApplicationStatus(**validated_data)
        if request:
            instance.user = request.user
        instance.save()
        return instance

    def validate(self, data):
        application = data.get("application")
        if not application:
            raise serializers.ValidationError("Application does not exist")

        if data["status"] == ApplicationStatus.SENT and application.status in (
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.DRAFT,
        ):
            raise serializers.ValidationError(
                "Cannot set the application status to SENT from %s status"
                % application.status
            )

        return data


class ApplicationEventStatusSerializer(serializers.ModelSerializer):
    application_event_id = serializers.PrimaryKeyRelatedField(
        queryset=ApplicationEvent.objects.all(), source="application_event"
    )
    user_id = serializers.PrimaryKeyRelatedField(source="user", read_only=True)

    class Meta:
        model = ApplicationEventStatus
        fields = [
            "status",
            "application_event_id",
            "user_id",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]

    def create(self, validated_data):
        request = self.context.get("request")
        instance = ApplicationEventStatus(**validated_data)
        if request and request.user.is_authenticated:
            instance.user = request.user

        if (
            instance.status == ApplicationEventStatus.APPROVED
            and not instance.application_event.is_approved
        ):
            create_reservations_from_allocation_results(instance.application_event)

        instance.save()
        return instance


class ApplicationEventWeeklyAmountReductionSerializer(serializers.ModelSerializer):
    application_event_schedule_result_id = serializers.PrimaryKeyRelatedField(
        source="application_event_schedule_result",
        queryset=ApplicationEventScheduleResult.objects.all(),
    )
    application_event_id = serializers.PrimaryKeyRelatedField(
        source="application_event", read_only=True
    )
    user = serializers.HiddenField(default=NullableCurrentUserDefault())

    class Meta:
        model = ApplicationEventWeeklyAmountReduction
        fields = [
            "id",
            "application_event_schedule_result_id",
            "user",
            "application_event_id",
        ]

    def create(self, validated_data):
        schedule_result = validated_data.pop("application_event_schedule_result")
        schedule_result.declined = True
        schedule_result.save()
        reduction = super().create(validated_data)
        return reduction

    def validate(self, data):
        result = data["application_event_schedule_result"]

        application_event: ApplicationEvent = (
            result.application_event_schedule.application_event
        )

        if result.accepted:
            raise serializers.ValidationError("Can't remove approved result.")
        reduction_count = ApplicationEventWeeklyAmountReduction.objects.filter(
            application_event=application_event
        ).count()

        if application_event.events_per_week < reduction_count + 1:
            raise serializers.ValidationError(
                "Can't reduce events per week to below zero."
            )
        data["application_event"] = application_event
        return data
