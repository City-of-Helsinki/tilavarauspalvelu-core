from graphene_django_extensions import CreateMutation, UpdateMutation

from api.graphql.types.address.types import AddressNode
from api.graphql.types.application.permissions import ApplicationPermission
from api.graphql.types.application.serializers import (
    ApplicationCancelSerializer,
    ApplicationCreateSerializer,
    ApplicationSendSerializer,
    ApplicationUpdateSerializer,
)
from api.graphql.types.application_section.types import ApplicationSectionNode
from api.graphql.types.organization.types import OrganisationNode
from api.graphql.types.person.types import PersonNode

__all__ = [
    "ApplicationCreateMutation",
    "ApplicationUpdateMutation",
    "ApplicationSendMutation",
    "ApplicationCancelMutation",
]


class ApplicationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ApplicationCreateSerializer
        permission_classes = [ApplicationPermission]
        nodes = [ApplicationSectionNode, AddressNode, PersonNode, OrganisationNode]


class ApplicationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationUpdateSerializer
        permission_classes = [ApplicationPermission]


class ApplicationSendMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationSendSerializer
        permission_classes = [ApplicationPermission]


class ApplicationCancelMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationCancelSerializer
        permission_classes = [ApplicationPermission]
