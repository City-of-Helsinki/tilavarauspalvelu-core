import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.spaces.space_types import ServiceSectorType
from api.graphql.units.unit_types import UnitGroupType, UnitType
from permissions.api_permissions.graphene_permissions import (
    GeneralRolePermission,
    ServiceSectorRolePermission,
    UnitRolePermission,
)
from permissions.models import GeneralRole, ServiceSectorRole, UnitRole


class RoleType(graphene.ObjectType):
    code = graphene.String()
    verbose_name = graphene.String()
    verbose_name_fi = graphene.String()
    verbose_name_sv = graphene.String()
    verbose_name_en = graphene.String()


class GeneralRoleType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (GeneralRolePermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    role = graphene.Field(RoleType)

    class Meta:
        model = GeneralRole
        fields = [
            "pk",
            "role",
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ServiceSectorRoleType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (ServiceSectorRolePermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    role = graphene.Field(RoleType)
    service_sector = graphene.Field(ServiceSectorType)

    class Meta:
        model = ServiceSectorRole
        fields = [
            "pk",
            "role",
            "service_sector",
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class UnitRoleType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (UnitRolePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    role = graphene.Field(RoleType)
    units = graphene.List(UnitType)
    unit_groups = graphene.List(UnitGroupType)

    class Meta:
        model = UnitRole
        fields = ["pk", "role", "units", "unit_groups"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_units(self, info: graphene.ResolveInfo):
        return self.unit.all()

    def resolve_unit_groups(self, info: graphene.ResolveInfo):
        return self.unit_group.all()
