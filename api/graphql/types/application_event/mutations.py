from typing import Any

from rest_framework.exceptions import ValidationError

from api.graphql.extensions.base_mutations import CreateAuthMutation, DeleteAuthMutation, UpdateAuthMutation
from api.graphql.types.application_event.permissions import (
    ApplicationEventDeclinePermission,
    ApplicationEventPermission,
)
from api.graphql.types.application_event.serializers import (
    ApplicationEventDeclineSerializer,
    ApplicationEventSerializer,
)
from api.graphql.types.application_event.types import ApplicationEventNode
from applications.choices import ApplicationEventStatusChoice
from applications.models import ApplicationEvent


class ApplicationEventCreateMutation(CreateAuthMutation):
    class Meta:
        node = ApplicationEventNode
        serializer_class = ApplicationEventSerializer
        permission_classes = (ApplicationEventPermission,)


class ApplicationEventUpdateMutation(UpdateAuthMutation):
    class Meta:
        node = ApplicationEventNode
        serializer_class = ApplicationEventSerializer
        permission_classes = (ApplicationEventPermission,)


class ApplicationEventDeleteMutation(DeleteAuthMutation):
    class Meta:
        model = ApplicationEvent
        permission_classes = (ApplicationEventPermission,)

    @classmethod
    def validate(cls, instance: ApplicationEvent, **kwargs: Any) -> None:
        if instance.status != ApplicationEventStatusChoice.UNALLOCATED:
            raise ValidationError("Application event has been allocated and cannot be deleted anymore.")


class ApplicationEventDeclineMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = ApplicationEventDeclineSerializer
        permission_classes = (ApplicationEventDeclinePermission,)
