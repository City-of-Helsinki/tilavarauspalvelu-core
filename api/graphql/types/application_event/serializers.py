from collections import defaultdict
from datetime import datetime
from typing import Any

from rest_framework import serializers
from rest_framework.settings import api_settings

from applications.models import ApplicationEvent, ApplicationEventSchedule, EventReservationUnit
from applications.validators import validate_event_reservation_unit_preferred_ordering
from common.serializers import TranslatedModelSerializer


class EventReservationUnitSerializer(TranslatedModelSerializer):
    class Meta:
        model = EventReservationUnit
        fields = [
            "pk",
            "preferred_order",
            "reservation_unit",
        ]


class ApplicationEventScheduleInEventSerializer(TranslatedModelSerializer):
    class Meta:
        model = ApplicationEventSchedule
        fields = [
            "pk",
            "day",
            "begin",
            "end",
            "priority",
        ]


class ApplicationEventSerializer(TranslatedModelSerializer):
    instance: ApplicationEvent

    application_event_schedules = ApplicationEventScheduleInEventSerializer(many=True)
    event_reservation_units = EventReservationUnitSerializer(many=True)

    class Meta:
        model = ApplicationEvent
        fields = [
            "pk",
            "name",
            "num_persons",
            "min_duration",
            "max_duration",
            "begin",
            "end",
            "events_per_week",
            "biweekly",
            "application",
            "age_group",
            "ability_group",
            "purpose",
            "application_event_schedules",
            "event_reservation_units",
        ]

    def validate_event_reservation_units(self, data: list[dict[str, Any]]) -> list[dict[str, Any]]:
        validate_event_reservation_unit_preferred_ordering(self.instance, data)
        return data

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        min_duration: datetime | None = data.get("min_duration")
        max_duration: datetime | None = data.get("max_duration")

        if max_duration is not None and min_duration is not None and max_duration < min_duration:
            errors["max_duration"].append("Maximum duration should be larger than minimum duration")

        if errors:
            raise serializers.ValidationError(errors)

        return data


class ApplicationEventDeclineSerializer(TranslatedModelSerializer):
    instance: ApplicationEvent

    class Meta:
        model = ApplicationEvent
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        event_status = self.instance.status
        application_status = self.instance.application.status

        if not event_status.can_decline:
            msg = f"Event cannot be declined in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_decline:
            msg = f"Event cannot be declined when application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def save(self, **kwargs: Any) -> ApplicationEvent:
        self.instance.actions.decline_event_schedules()
        return self.instance
