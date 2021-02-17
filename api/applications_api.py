from datetime import datetime
from typing import Union

from dateutil.parser import parse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers, viewsets
from rest_framework.exceptions import ValidationError

from applications.models import (
    Address,
    Application,
    ApplicationAggregateData,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationStatus,
    EventReservationUnit,
    Organisation,
    Person,
    Recurrence,
)
from reservation_units.models import Purpose, ReservationUnit
from reservations.models import AbilityGroup, AgeGroup

MINIMUM_TIME = timezone.datetime(
    1970, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)

MAXIMUM_TIME = timezone.datetime(
    2099, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address

        fields = ["id", "street_address", "post_code", "city"]


class AddressViewSet(viewsets.ModelViewSet):

    queryset = Address.objects.all()

    serializer_class = AddressSerializer

    def perform_create(self, serializer):
        serializer.save()


class OrganisationSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = Organisation
        fields = [
            "id",
            "name",
            "identifier",
            "year_established",
            "active_members",
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

    class Meta:
        model = EventReservationUnit
        fields = [
            "id",
            "priority",
            "reservation_unit_id",
        ]
        extra_kwargs = {
            "priority": {
                "help_text": "Priority of this reservation unit for the event. Lower the number, higher the priority.",
            },
        }


class ApplicationAggregateDataSerializer(serializers.ModelSerializer):
    name = serializers.CharField(help_text="Name of the aggregated data")
    value = serializers.FloatField(help_text="Computed value")

    class Meta:
        model = ApplicationAggregateData
        fields = [
            "name",
            "value",
        ]


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

    ability_group_id = serializers.PrimaryKeyRelatedField(
        queryset=AbilityGroup.objects.all(),
        source="ability_group",
        allow_null=True,
        help_text="Id of the ability group for this event.",
    )

    purpose_id = serializers.PrimaryKeyRelatedField(
        queryset=Purpose.objects.all(),
        source="purpose",
        allow_null=True,
        help_text="Id of the usa purpose for this event.",
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

    class Meta:
        model = ApplicationEvent
        fields = [
            "id",
            "name",
            "application_event_schedules",
            "num_persons",
            "age_group_id",
            "ability_group_id",
            "min_duration",
            "max_duration",
            "application_id",
            "events_per_week",
            "biweekly",
            "begin",
            "end",
            "purpose_id",
            "event_reservation_units",
            "status",
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

    aggregated_data = ApplicationAggregateDataSerializer(
        help_text="Summary data for application after it is in review",
        read_only=True,
        many=True,
    )

    class Meta:
        model = Application
        fields = [
            "id",
            "organisation",
            "application_round_id",
            "contact_person",
            "user",
            "application_events",
            "status",
            "aggregated_data",
        ]

    @staticmethod
    def handle_person(contact_person_data) -> Union[Person, None]:
        person = None
        if contact_person_data is not None:
            person = Person(**contact_person_data)
            person.save()
        return person

    @staticmethod
    def handle_organisation(organisation_data) -> Union[Organisation, None]:
        organisation = None
        if organisation_data is not None:
            organisation = Organisation(**organisation_data)
            organisation.save()
        return organisation

    def validate(self, data):
        # Validations when user submits application for review
        if "status" in data and data["status"] == ApplicationStatus.IN_REVIEW:
            data = self.validate_for_review(data)

        return data

    def validate_for_review(self, data):
        application_events = data.get("application_events", [])
        if not len(application_events):
            raise ValidationError(_("Application must have application events"))
        else:
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

    def handle_events(self, appliction_instance, event_data):
        event_ids = []
        for event in event_data:
            event["application"] = appliction_instance
            if "id" not in event or ["id"] is None:
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
        ApplicationEvent.objects.filter(application=appliction_instance).exclude(
            id__in=event_ids
        ).delete()

    def create(self, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

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

        self.handle_events(appliction_instance=app, event_data=event_data)

        app.set_status(status, request_user)

        return app

    def update(self, instance, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

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

        self.handle_events(appliction_instance=instance, event_data=event_data)

        app = super().update(instance, validated_data)

        app.set_status(status, request_user)

        return app


class ApplicationViewSet(viewsets.ModelViewSet):

    queryset = Application.objects.all()

    serializer_class = ApplicationSerializer


class ApplicationEventViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationEventSerializer

    queryset = ApplicationEvent.objects.all()

    def get_serializer_context(self):
        start: datetime = self.request.query_params.get("start", None)
        end: datetime = self.request.query_params.get("end", None)
        if start is not None:
            start = parse(start)
        if end is not None:
            end = parse(end)
        return {"start": start, "end": end}
