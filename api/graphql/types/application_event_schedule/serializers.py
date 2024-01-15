from collections import defaultdict
from typing import Any

from rest_framework import serializers
from rest_framework.settings import api_settings

from applications.models import ApplicationEventSchedule
from common.serializers import TranslatedModelSerializer


class ApplicationEventScheduleApproveSerializer(TranslatedModelSerializer):
    instance: ApplicationEventSchedule

    class Meta:
        model = ApplicationEventSchedule
        fields = [
            "pk",
            "allocated_day",
            "allocated_begin",
            "allocated_end",
            "allocated_reservation_unit",
        ]
        # All fields should be set when approving a schedule
        extra_kwargs = {
            "allocated_day": {"required": True},
            "allocated_begin": {"required": True},
            "allocated_end": {"required": True},
            "allocated_reservation_unit": {"required": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        event_status = self.instance.application_event.status
        application_status = self.instance.application_event.application.status

        if not event_status.can_approve:
            msg = f"Schedule cannot be approved for event in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_approve:
            msg = f"Schedule cannot be approved for application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance: ApplicationEventSchedule, validated_data: dict[str, Any]):
        return super().update(instance, validated_data)


class ApplicationEventScheduleDeclineSerializer(TranslatedModelSerializer):
    instance: ApplicationEventSchedule

    class Meta:
        model = ApplicationEventSchedule
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        event_status = self.instance.application_event.status
        application_status = self.instance.application_event.application.status

        if not event_status.can_decline:
            msg = f"Schedule cannot be declined for event in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_decline:
            msg = f"Schedule cannot be declined for application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance: ApplicationEventSchedule, validated_data: dict[str, Any]):
        instance.declined = True
        return super().update(instance, validated_data)


class ApplicationEventScheduleResetSerializer(TranslatedModelSerializer):
    instance: ApplicationEventSchedule

    class Meta:
        model = ApplicationEventSchedule
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        event_status = self.instance.application_event.status
        application_status = self.instance.application_event.application.status

        if not event_status.can_reset:
            msg = f"Schedule cannot be reset for event in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_reset:
            msg = f"Schedule cannot be reset for application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance: ApplicationEventSchedule, validated_data: dict[str, Any]):
        instance.allocated_day = None
        instance.allocated_begin = None
        instance.allocated_end = None
        instance.allocated_reservation_unit = None
        instance.declined = False
        return super().update(instance, validated_data)
