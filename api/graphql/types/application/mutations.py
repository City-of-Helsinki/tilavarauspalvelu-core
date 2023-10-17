from api.graphql.extensions.base_mutations import CreateAuthMutation, UpdateAuthMutation
from api.graphql.types.application.permissions import ApplicationDeclinePermission, ApplicationPermission
from api.graphql.types.application.serializers import (
    ApplicationCancelSerializer,
    ApplicationDeclineSerializer,
    ApplicationSendSerializer,
    ApplicationSerializer,
)
from api.graphql.types.application.types import ApplicationNode


class ApplicationCreateMutation(CreateAuthMutation):
    class Meta:
        node = ApplicationNode
        serializer_class = ApplicationSerializer
        permission_classes = (ApplicationPermission,)


class ApplicationUpdateMutation(UpdateAuthMutation):
    class Meta:
        node = ApplicationNode
        serializer_class = ApplicationSerializer
        permission_classes = (ApplicationPermission,)


class ApplicationDeclineMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = ApplicationDeclineSerializer
        permission_classes = (ApplicationDeclinePermission,)


class ApplicationSendMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = ApplicationSendSerializer
        permission_classes = (ApplicationPermission,)


class ApplicationCancelMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = ApplicationCancelSerializer
        permission_classes = (ApplicationPermission,)
