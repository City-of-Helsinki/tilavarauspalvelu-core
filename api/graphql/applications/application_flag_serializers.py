from graphql import GraphQLError
from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from applications.models import Application, ApplicationEvent, ApplicationStatus


class SetFlaggedBaseSerializer(PrimaryKeySerializer):
    CAN_FLAG_STATUSES = (
        ApplicationStatus.IN_REVIEW,
        ApplicationStatus.REVIEW_DONE,
        ApplicationStatus.ALLOCATED,
        ApplicationStatus.HANDLED,
        ApplicationStatus.SENT,
    )

    def get_application_status(self):
        """Override in subclasses"""
        return None

    def validate(self, data):
        status = self.get_application_status()
        flagged = data.get("flagged")

        if status not in self.CAN_FLAG_STATUSES:
            raise GraphQLError(f"Only application with status as {', '.join(self.CAN_FLAG_STATUSES)} can be flagged.")

        # If Application status is SENT only setting flagged to False is possible.
        if status == ApplicationStatus.SENT and flagged:
            raise GraphQLError("Application status is send. Only setting the flagged to False is possible.")

        data = super().validate(data)

        return data


class ApplicationEventFlagSerializer(SetFlaggedBaseSerializer):
    class Meta:
        model = ApplicationEvent
        fields = [
            "pk",
            "flagged",
        ]

    def get_application_status(self):
        return self.instance.application.status


class ApplicationFlagSerializer(SetFlaggedBaseSerializer):
    flagged = serializers.BooleanField()

    class Meta:
        model = Application
        fields = [
            "pk",
            "flagged",
        ]

    def get_application_status(self):
        return self.instance.status

    def save(self, **kwargs):
        flagged = self.validated_data.get("flagged")
        self.instance.application_events.all().update(flagged=flagged)

        # Pop flagged from fields before going further, otherwise graphene throws an error.
        self.fields.pop("flagged")
        return self.instance
