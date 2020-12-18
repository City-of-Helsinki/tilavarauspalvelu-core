from datetime import datetime
from typing import Union

from dateutil.parser import parse
from django.utils import timezone
from rest_framework import serializers, viewsets

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationPeriod,
    EventReservationUnit,
    Organisation,
    Person,
    Recurrence,
)
from reservation_units.models import Purpose
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

        fields = ["id", "name", "identifier", "year_established"]


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

    class Meta:
        model = EventReservationUnit
        fields = [
            "id",
            "priority",
            "reservation_unit",
        ]


class ApplicationEventSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(allow_null=True, required=False)

    application_event_schedules = ApplicationEventScheduleSerializer(
        many=True, read_only=False
    )

    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(), source="application"
    )

    age_group_id = serializers.PrimaryKeyRelatedField(
        queryset=AgeGroup.objects.all(), source="age_group"
    )

    ability_group_id = serializers.PrimaryKeyRelatedField(
        queryset=AbilityGroup.objects.all(), source="ability_group"
    )

    purpose_id = serializers.PrimaryKeyRelatedField(
        queryset=Purpose.objects.all(), source="purpose"
    )

    event_reservation_units = EventReservationUnitSerializer(many=True, read_only=False)

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
        ]

    def validate(self, data):
        min_duration = data["min_duration"]
        max_duration = data["max_duration"]

        if max_duration is not None and max_duration <= min_duration:
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
        schedule_data = validated_data.pop("application_event_schedules")
        unit_data = validated_data.pop("event_reservation_units")

        event = super().create(validated_data)
        self.handle_event_schedules(
            schedule_data=schedule_data, application_event=event
        )

        self.handle_units(event_unit_data=unit_data, application_event=event)

        return event

    def update(self, instance, validated_data):

        schedule_data = validated_data.pop("application_event_schedules")

        unit_data = validated_data.pop("event_reservation_units")

        super().update(instance, validated_data)
        self.handle_event_schedules(schedule_data, instance)

        self.handle_units(event_unit_data=unit_data, application_event=instance)

        return instance


class ApplicationSerializer(serializers.ModelSerializer):

    contact_person = PersonSerializer(read_only=False, allow_null=True)

    organisation = OrganisationSerializer(read_only=False, allow_null=True)

    application_period_id = serializers.PrimaryKeyRelatedField(
        queryset=ApplicationPeriod.objects.all(), source="application_period"
    )

    user = serializers.HiddenField(default=NullableCurrentUserDefault())

    application_events = ApplicationEventSerializer(many=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "organisation",
            "application_period_id",
            "contact_person",
            "user",
            "application_events",
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

        return app

    def update(self, instance, validated_data):
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

        return super().update(instance, validated_data)


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
