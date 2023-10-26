from collections import defaultdict
from typing import Any

from django.utils import timezone
from rest_framework import serializers
from rest_framework.settings import api_settings

from api.graphql.types.address.serializers import AddressSerializer
from api.graphql.types.application_event.serializers import ApplicationEventSerializer
from api.graphql.types.organization.serializers import OrganisationSerializer
from api.graphql.types.person.serializers import PersonSerializer
from applications.models import Application, ApplicationEvent
from common.serializers import TranslatedModelSerializer


class ApplicationEventInApplicationSerializer(ApplicationEventSerializer):
    class Meta:
        model = ApplicationEvent
        fields = [field for field in ApplicationEventSerializer.Meta.fields if field != "application"]


class ApplicationSerializer(TranslatedModelSerializer):
    organisation = OrganisationSerializer(required=False, allow_null=True)
    contact_person = PersonSerializer(required=False, allow_null=True)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    application_events = ApplicationEventInApplicationSerializer(required=False, many=True)
    billing_address = AddressSerializer(required=False, allow_null=True)

    class Meta:
        model = Application
        fields = [
            "pk",
            "applicant_type",
            "organisation",
            "application_round",
            "contact_person",
            "user",
            "application_events",
            "status",
            "billing_address",
            "home_city",
            "created_date",
            "last_modified_date",
            "additional_information",
        ]
        extra_kwargs = {
            "home_city": {
                "required": False,
                "allow_null": True,
            },
        }


class ApplicationDeclineSerializer(TranslatedModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        status = self.instance.status
        if not status.can_decline:
            msg = f"Application in status '{status.value}' cannot be declined."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def save(self, **kwargs: Any) -> Application:
        self.instance.actions.decline()
        return self.instance


class ApplicationSendSerializer(TranslatedModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        application_events = self.instance.application_events.all()

        if len(application_events) == 0:
            msg = "Application requires application events before it can be sent."
            errors["application_events"].append(msg)

        for event in application_events:
            for field in ApplicationEvent.required_for_review:
                value = getattr(event, field, None)
                if value is None:
                    msg = (
                        f"Field '{field}' is required for application event '{event.name}' "
                        f"before the application can be sent."
                    )
                    errors["application_events"].append(msg)

        if self.instance.contact_person is None:
            msg = "Contact person is required for application before the it can be sent."
            errors["contact_person"].append(msg)

        status = self.instance.status
        if not status.can_send:
            msg = f"Application in status '{status.value}' cannot be sent."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def save(self, **kwargs: Any) -> Application:
        self.instance.sent_date = timezone.now()
        self.instance.save()
        return self.instance


class ApplicationCancelSerializer(TranslatedModelSerializer):
    instance: Application

    class Meta:
        model = Application
        fields = [
            "pk",
        ]

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
        self.instance.cancelled_date = timezone.now()
        self.instance.save()
        return self.instance
