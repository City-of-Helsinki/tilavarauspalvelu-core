import graphene
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.applications.application_decline_serializers import (
    ApplicationDeclineSerializer,
    ApplicationEventDeclineSerializer,
)
from api.graphql.applications.application_event_serializers import (
    ApplicationEventCreateSerializer,
    ApplicationEventScheduleResultCreateSerializer,
    ApplicationEventScheduleResultUpdateSerializer,
    ApplicationEventUpdateSerializer,
)
from api.graphql.applications.application_flag_serializers import (
    ApplicationEventFlagSerializer,
    ApplicationFlagSerializer,
)
from api.graphql.applications.application_serializers import (
    ApplicationCreateSerializer,
    ApplicationUpdateSerializer,
)
from api.graphql.applications.application_types import (
    ApplicationEventScheduleResultType,
    ApplicationEventType,
    ApplicationType,
)
from api.graphql.base_mutations import AuthDeleteMutation, AuthSerializerMutation
from applications.models import ApplicationEvent, ApplicationEventStatus
from permissions.api_permissions.graphene_permissions import (
    ApplicationDeclinePermission,
    ApplicationEventDeclinePermission,
    ApplicationEventPermission,
    ApplicationEventScheduleResultPermission,
    ApplicationEventSetFlagPermission,
    ApplicationPermission,
    ApplicationSetFlagPermission,
)


class ApplicationCreateMutation(AuthSerializerMutation, SerializerMutation):
    application = graphene.Field(ApplicationType)

    permission_classes = (ApplicationPermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ApplicationCreateSerializer


class ApplicationUpdateMutation(AuthSerializerMutation, SerializerMutation):
    application = graphene.Field(ApplicationType)

    permission_classes = (ApplicationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ApplicationUpdateSerializer


class ApplicationEventCreateMutation(AuthSerializerMutation, SerializerMutation):
    application_event = graphene.Field(ApplicationEventType)

    permission_classes = (ApplicationEventPermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ApplicationEventCreateSerializer


class ApplicationEventUpdateMutation(AuthSerializerMutation, SerializerMutation):
    application_event = graphene.Field(ApplicationEventType)

    permission_classes = (ApplicationEventPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ApplicationEventUpdateSerializer


class ApplicationEventDeleteMutation(AuthDeleteMutation, ClientIDMutation):
    permission_classes = (ApplicationEventPermission,)
    model = ApplicationEvent

    @classmethod
    def validate(self, root, info, **input):
        event = get_object_or_404(ApplicationEvent, pk=input.get("pk", None))
        if event.status != ApplicationEventStatus.CREATED:
            raise ValidationError("ApplicationEvent cannot be deleted anymore.")

        return None


class ApplicationEventScheduleResultCreateMutation(AuthSerializerMutation, SerializerMutation):
    application_event_schedule_result = graphene.Field(ApplicationEventScheduleResultType)

    permission_classes = (ApplicationEventScheduleResultPermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ApplicationEventScheduleResultCreateSerializer


class ApplicationEventScheduleResultUpdateMutation(AuthSerializerMutation, SerializerMutation):
    application_event_schedule_result = graphene.Field(ApplicationEventScheduleResultType)

    permission_classes = (ApplicationEventScheduleResultPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "application_event_schedule"
        serializer_class = ApplicationEventScheduleResultUpdateSerializer


class ApplicationDeclineMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ApplicationDeclinePermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ApplicationDeclineSerializer


class ApplicationEventDeclineMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ApplicationEventDeclinePermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ApplicationEventDeclineSerializer


class ApplicationEventFlagMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ApplicationEventSetFlagPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ApplicationEventFlagSerializer


class ApplicationFlagMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ApplicationSetFlagPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ApplicationFlagSerializer
