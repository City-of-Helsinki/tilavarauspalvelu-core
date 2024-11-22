from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Any

from django.utils import timezone
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
from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import AllocatedTimeSlot, Application, ReservationUnitOption
from utils.fields.serializer import CurrentUserDefaultNullable

if TYPE_CHECKING:
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
        errors: dict[str, list[str]] = defaultdict(list)

        if not self.instance.application_sections.exists():
            msg = "Application requires application sections before it can be sent."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if self.instance.contact_person is None:
            msg = "Contact person is required for application before the it can be sent."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

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
        self.instance.cancelled_date = timezone.now()
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
