from rest_framework import serializers

from api.applications_api.serializers import (
    ApplicationEventScheduleSerializer,
    ApplicationEventSerializer,
    ApplicationEventStatusSerializer,
)
from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.choice_char_field import ChoiceCharField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventStatus,
    EventReservationUnit,
)
from reservation_units.models import ReservationUnit
from reservations.models import AbilityGroup, AgeGroup, ReservationPurpose


class ApplicationEventScheduleCreateSerializer(
    ApplicationEventScheduleSerializer, PrimaryKeySerializer
):
    day = serializers.IntegerField()

    class Meta:
        model = ApplicationEventSchedule
        fields = ["pk", "day", "begin", "end", "priority"]
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
            "priority": {
                "help_text": (
                    "Priority of requested reservation allocation slot as an integer."
                ),
            },
        }


class EventReservationUnitCreateSerializer(PrimaryKeySerializer):
    reservation_unit = IntegerPrimaryKeyField(
        queryset=ReservationUnit.objects.all(),
        help_text="pk of the reservation unit requested for the event.",
    )

    class Meta:
        model = EventReservationUnit
        fields = [
            "pk",
            "priority",
            "reservation_unit",
        ]
        extra_kwargs = {
            "priority": {
                "help_text": "Priority of this reservation unit for the event. Lower the number, higher the priority.",
            },
        }


class ApplicationEventCreateSerializer(
    ApplicationEventSerializer, PrimaryKeySerializer
):
    application_event_schedules = ApplicationEventScheduleCreateSerializer(many=True)

    event_reservation_units = EventReservationUnitCreateSerializer(many=True)

    status = ChoiceCharField(
        help_text="Status of this application event",
        choices=ApplicationEventStatus.STATUS_CHOICES,
    )

    application = IntegerPrimaryKeyField(
        help_text="Application pk for this event", queryset=Application.objects.all()
    )

    age_group = IntegerPrimaryKeyField(
        help_text="Age group pk for this event", queryset=AgeGroup.objects.all()
    )

    purpose = IntegerPrimaryKeyField(
        help_text="ReservationPurpose pk for this event",
        queryset=ReservationPurpose.objects.all(),
    )

    ability_group = IntegerPrimaryKeyField(
        help_text="AbilityGroup pk for this event", queryset=AbilityGroup.objects.all()
    )

    class Meta:
        model = ApplicationEvent
        fields = [
            "pk",
            "name",
            "application_event_schedules",
            "num_persons",
            "age_group",
            "ability_group",
            "min_duration",
            "max_duration",
            "application",
            "events_per_week",
            "biweekly",
            "begin",
            "end",
            "purpose",
            "event_reservation_units",
            "status",
        ]


class ApplicationEventUpdateSerializer(
    ApplicationEventCreateSerializer, PrimaryKeyUpdateSerializer
):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for name, field in self.fields.items():
            if name == "pk":
                continue
            field.required = False

    def update(self, instance, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )
        schedule_data = validated_data.pop("application_event_schedules", None)
        unit_data = validated_data.pop("event_reservation_units", None)
        status = validated_data.pop("status", None)

        event = super(ApplicationEventSerializer, self).update(instance, validated_data)
        if schedule_data:
            self.handle_event_schedules(schedule_data, instance)

        self.handle_units(event_unit_data=unit_data, application_event=instance)

        event.set_status(status, request_user)
        return instance


class ApplicationEventStatusCreateSerializer(
    ApplicationEventStatusSerializer, PrimaryKeySerializer
):
    class Meta:
        model = ApplicationEventStatus
        fields = [
            "status",
            "application_event_id",
            "user_id",
            "timestamp",
        ]
