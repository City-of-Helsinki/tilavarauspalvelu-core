import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.spaces.space_types import ServiceSectorType
from api.graphql.units.unit_types import UnitGroupType, UnitType
from permissions.api_permissions.graphene_permissions import (
    GeneralRolePermission,
    ServiceSectorRolePermission,
    UnitRolePermission,
)
from permissions.helpers import can_view_users
from permissions.models import GeneralRole
from permissions.models import GeneralRolePermission as GeneralRolePermissionModel
from permissions.models import ServiceSectorRole
from permissions.models import (
    ServiceSectorRolePermission as ServiceSectorRolePermissionModel,
)
from permissions.models import UnitRole
from permissions.models import UnitRolePermission as UnitRolePermissionModel


class RoleType(graphene.ObjectType):
    code = graphene.String()
    verbose_name = graphene.String()
    verbose_name_fi = graphene.String()
    verbose_name_sv = graphene.String()
    verbose_name_en = graphene.String()


class IncludePermissionsMixin:
    def resolve_permissions(self, info: graphene.ResolveInfo):
        if info.context.user == self.user or can_view_users(info.context.user):
            return self.role.permissions.all()

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


class GeneralRoleType(AuthNode, PrimaryKeyObjectType, IncludePermissionsMixin):
    permission_classes = (
        (GeneralRolePermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    role = graphene.Field(RoleType)
    permissions = graphene.List(GeneralRolePermissionType)

    class Meta:
        model = GeneralRole
        fields = [
            "pk",
            "role",
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ServiceSectorRoleType(AuthNode, PrimaryKeyObjectType, IncludePermissionsMixin):
    permission_classes = (
        (ServiceSectorRolePermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

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
        connection_class = TilavarausBaseConnection


class UnitRoleType(AuthNode, PrimaryKeyObjectType, IncludePermissionsMixin):
    permission_classes = (
        (UnitRolePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    role = graphene.Field(RoleType)
    units = graphene.List(UnitType)
    unit_groups = graphene.List(UnitGroupType)
    permissions = graphene.List(UnitRolePermissionType)

    class Meta:
        model = UnitRole
        fields = ["pk", "role", "units", "unit_groups"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_units(self, info: graphene.ResolveInfo):
        return self.unit.all()

    def resolve_unit_groups(self, info: graphene.ResolveInfo):
        return self.unit_group.all()
