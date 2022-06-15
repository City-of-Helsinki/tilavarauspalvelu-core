import graphene
from django.conf import settings
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.permissions import AllowAny

from api.graphql.applications.application_event_serializers import (
    ApplicationEventCreateSerializer,
    ApplicationEventUpdateSerializer,
)
from api.graphql.applications.application_types import ApplicationEventType
from api.graphql.base_mutations import AuthDeleteMutation, AuthSerializerMutation
from applications.models import ApplicationEvent, ApplicationEventStatus
from permissions.api_permissions.graphene_permissions import ApplicationEventPermission


class ApplicationEventCreateMutation(AuthSerializerMutation, SerializerMutation):
    application_event = graphene.Field(ApplicationEventType)

    permission_classes = (
        (ApplicationEventPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model_operations = ["create"]

        serializer_class = ApplicationEventCreateSerializer


class ApplicationEventUpdateMutation(AuthSerializerMutation, SerializerMutation):
    application_event = graphene.Field(ApplicationEventType)

    permission_classes = (
        (ApplicationEventPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ApplicationEventUpdateSerializer


class ApplicationEventDeleteMutation(AuthDeleteMutation, ClientIDMutation):
    permission_classes = (
        (ApplicationEventPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )
    model = ApplicationEvent

    @classmethod
    def validate(self, root, info, **input):
        event = get_object_or_404(ApplicationEvent, pk=input.get("pk", None))
        if event.status != ApplicationEventStatus.CREATED:
            raise ValidationError("ApplicationEvent cannot be deleted anymore.")

        return None
