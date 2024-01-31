from typing import Any

import graphene
from graphene_permissions.mixins import AuthNode
from rest_framework.exceptions import PermissionDenied

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from api.graphql.types.permissions.permissions import (
    GeneralRolePermission,
    ServiceSectorRolePermission,
    UnitRolePermission,
)
from api.graphql.types.spaces.types import ServiceSectorType
from api.graphql.types.units.types import UnitGroupType, UnitType
from common.typing import GQLInfo
from permissions.helpers import can_view_users
from permissions.models import GeneralRole, ServiceSectorRole, UnitRole
from permissions.models import GeneralRolePermission as GeneralRolePermissionModel
from permissions.models import ServiceSectorRolePermission as ServiceSectorRolePermissionModel
from permissions.models import UnitRolePermission as UnitRolePermissionModel


class RoleType(graphene.ObjectType):
    code = graphene.String()
    verbose_name = graphene.String()
    verbose_name_fi = graphene.String()
    verbose_name_sv = graphene.String()
    verbose_name_en = graphene.String()


class IncludePermissionsMixin:
    def resolve_permissions(root: Any, info: GQLInfo):
        if info.context.user == root.user or can_view_users(info.context.user):
            return root.role.permissions.all()

        raise PermissionDenied("No permission to view permissions.")


class GeneralRolePermissionType(graphene.ObjectType):
    permission = graphene.String()

    class Meta:
        model = GeneralRolePermissionModel
        fields = ["permission"]


class ServiceSectorRolePermissionType(graphene.ObjectType):
    permission = graphene.String()

    class Meta:
        model = ServiceSectorRolePermissionModel
        fields = ["permission"]


class UnitRolePermissionType(graphene.ObjectType):
    permission = graphene.String()

    class Meta:
        model = UnitRolePermissionModel
        fields = ["permission"]


class GeneralRoleType(AuthNode, OldPrimaryKeyObjectType, IncludePermissionsMixin):
    permission_classes = (GeneralRolePermission,)

    role = graphene.Field(RoleType)
    permissions = graphene.List(GeneralRolePermissionType)

    class Meta:
        model = GeneralRole
        fields = [
            "pk",
            "role",
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class ServiceSectorRoleType(AuthNode, OldPrimaryKeyObjectType, IncludePermissionsMixin):
    permission_classes = (ServiceSectorRolePermission,)

    role = graphene.Field(RoleType)
    service_sector = graphene.Field(ServiceSectorType)
    permissions = graphene.List(ServiceSectorRolePermissionType)

    class Meta:
        model = ServiceSectorRole
        fields = [
            "pk",
            "role",
            "service_sector",
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class UnitRoleType(AuthNode, OldPrimaryKeyObjectType, IncludePermissionsMixin):
    permission_classes = (UnitRolePermission,)

    role = graphene.Field(RoleType)
    units = graphene.List(UnitType)
    unit_groups = graphene.List(UnitGroupType)
    permissions = graphene.List(UnitRolePermissionType)

    class Meta:
        model = UnitRole
        fields = ["pk", "role", "units", "unit_groups"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_units(root: UnitRole, info: GQLInfo):
        return root.unit.all()

    def resolve_unit_groups(root: UnitRole, info: GQLInfo):
        return root.unit_group.all()
