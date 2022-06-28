from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationStatus,
)


class ApplicationDeclineSerializer(PrimaryKeySerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["status"].read_only = True

    class Meta:
        model = Application
        fields = [
            "pk",
            "status",
        ]

    CAN_DECLINE_STATUSES = (
        ApplicationStatus.IN_REVIEW,
        ApplicationStatus.REVIEW_DONE,
        ApplicationStatus.ALLOCATED,
    )

    def validate(self, data):
        if self.instance.status not in self.CAN_DECLINE_STATUSES:
            raise serializers.ValidationError(
                f"Only applications with status as {', '.join(self.CAN_DECLINE_STATUSES)} can be approved."
            )
        data = super().validate(data)

        return data

    def save(self, **kwargs):
        for event in self.instance.application_events.all():
            event.set_status(ApplicationEventStatus.DECLINED)
        return self.instance


class ApplicationEventDeclineSerializer(PrimaryKeySerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["status"].read_only = True

    class Meta:
        model = ApplicationEvent
        fields = [
            "pk",
            "status",
        ]

    CAN_DECLINE_STATUSES = (
        ApplicationEventStatus.CREATED,
        ApplicationEventStatus.APPROVED,
        ApplicationEventStatus.FAILED,
    )

    def validate(self, data):
        if self.instance.status not in self.CAN_DECLINE_STATUSES:
            raise serializers.ValidationError(
                f"Only application events with status as {', '.join(self.CAN_DECLINE_STATUSES)} can be approved."
            )

        if (
            self.instance.application.status
            not in ApplicationDeclineSerializer.CAN_DECLINE_STATUSES
        ):
            raise serializers.ValidationError(
                f"Only application events with application status as "
                f"{', '.join(ApplicationDeclineSerializer.CAN_DECLINE_STATUSES)} can be approved."
            )

        data = super().validate(data)

        return data

    def save(self, **kwargs):
        self.instance.set_status(ApplicationEventStatus.DECLINED)
        return self.instance
