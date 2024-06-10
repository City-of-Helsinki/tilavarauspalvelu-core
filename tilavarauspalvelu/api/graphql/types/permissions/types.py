import graphene
from graphene_django_extensions import DjangoNode
from query_optimizer import DjangoListField

from common.typing import GQLInfo
from permissions.helpers import can_view_users
from permissions.models import (
    GeneralPermissionChoices,
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorPermissionsChoices,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitPermissionChoices,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)

from .permissions import (
    GeneralRolePermissionPermission,
    ServiceSectorRolePermissionPermission,
    UnitRolePermissionPermission,
)

__all__ = [
    "GeneralRoleChoiceNode",
    "GeneralRoleNode",
    "GeneralRolePermissionNode",
    "ServiceSectorRoleChoiceNode",
    "ServiceSectorRoleNode",
    "ServiceSectorRolePermissionNode",
    "UnitRoleChoiceNode",
    "UnitRoleNode",
    "UnitRolePermissionNode",
]


# General


class GeneralRoleChoiceNode(DjangoNode):
    permissions = DjangoListField(lambda: GeneralRolePermissionNode)

    class Meta:
        model = GeneralRoleChoice
        fields = [
            "code",
            "verbose_name",
            "permissions",
        ]


class GeneralRolePermissionNode(DjangoNode):
    permission = graphene.Field(graphene.Enum.from_enum(GeneralPermissionChoices))

    class Meta:
        model = GeneralRolePermission
        fields = [
            "pk",
            "permission",
        ]

    def resolve_permission(root: GeneralRolePermission, info: GQLInfo) -> str:
        return root.permission.upper()


class GeneralRoleNode(DjangoNode):
    class Meta:
        model = GeneralRole
        fields = [
            "pk",
            "role",
        ]
        restricted_fields = {
            "role": lambda user, role: user == role.user or can_view_users(user),
        }
        permission_classes = [GeneralRolePermissionPermission]


# Unit


class UnitRoleChoiceNode(DjangoNode):
    permissions = DjangoListField(lambda: UnitRolePermissionNode)

    class Meta:
        model = UnitRoleChoice
        fields = [
            "code",
            "verbose_name",
            "permissions",
        ]


class UnitRolePermissionNode(DjangoNode):
    permission = graphene.Field(graphene.Enum.from_enum(UnitPermissionChoices))

    class Meta:
        model = UnitRolePermission
        fields = [
            "pk",
            "permission",
        ]

    def resolve_permission(root: GeneralRolePermission, info: GQLInfo) -> str:
        return root.permission.upper()


class UnitRoleNode(DjangoNode):
    class Meta:
        model = UnitRole
        fields = [
            "pk",
            "role",
            "unit",
            "unit_group",
        ]
        restricted_fields = {
            "role": lambda user, role: user == role.user or can_view_users(user),
        }
        permission_classes = [UnitRolePermissionPermission]


# Service Sector


class ServiceSectorRoleChoiceNode(DjangoNode):
    permissions = DjangoListField(lambda: ServiceSectorRolePermissionNode)

    class Meta:
        model = ServiceSectorRoleChoice
        fields = [
            "code",
            "verbose_name",
            "permissions",
        ]


class ServiceSectorRolePermissionNode(DjangoNode):
    permission = graphene.Field(graphene.Enum.from_enum(ServiceSectorPermissionsChoices))

    class Meta:
        model = ServiceSectorRolePermission
        fields = [
            "pk",
            "permission",
        ]

    def resolve_permission(root: GeneralRolePermission, info: GQLInfo) -> str:
        return root.permission.upper()


class ServiceSectorRoleNode(DjangoNode):
    class Meta:
        model = ServiceSectorRole
        fields = [
            "pk",
            "role",
            "service_sector",
        ]
        restricted_fields = {
            "role": lambda user, role: user == role.user or can_view_users(user),
        }
        permission_classes = [ServiceSectorRolePermissionPermission]
