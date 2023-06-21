import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.translate_fields import get_all_translatable_fields
from permissions.api_permissions.graphene_field_decorators import (
    check_resolver_permission,
)
from permissions.api_permissions.graphene_permissions import (
    ResourcePermission,
    SpacePermission,
)
from spaces.models import Building, Location, RealEstate, ServiceSector, Space


class RealEstateType(PrimaryKeyObjectType):
    class Meta:
        model = RealEstate
        fields = ["pk", "surface_area"] + get_all_translatable_fields(model)
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class BuildingType(PrimaryKeyObjectType):
    real_estate = RealEstateType()

    class Meta:
        model = Building
        fields = [
            "pk",
            "real_estate",
            "surface_area",
        ] + get_all_translatable_fields(model)
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class SpaceType(AuthNode, PrimaryKeyObjectType):

    permission_classes = (SpacePermission,)
    children = graphene.List(lambda: SpaceType)
    resources = graphene.List("api.graphql.resources.resource_types.ResourceType")
    surface_area = graphene.Float()

    class Meta:
        model = Space
        fields = [
            "pk",
            "parent",
            "building",
            "surface_area",
            "unit",
            "code",
            "max_persons",
            "parent",
        ] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_children(self, info):
        return Space.objects.filter(parent=self)

    @check_resolver_permission(ResourcePermission)
    def resolve_resources(self, info):
        return self.resource_set.all()


class LocationType(PrimaryKeyObjectType):
    longitude = graphene.String()
    latitude = graphene.String()

    def resolve_longitude(self, obj):
        return self.lon

    def resolve_latitude(self, obj):
        return self.lat

    class Meta:
        model = Location
        fields = [
            "address_zip",
            "longitude",
            "latitude",
        ] + get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ServiceSectorType(PrimaryKeyObjectType):
    class Meta:
        model = ServiceSector
        fields = ["id"] + get_all_translatable_fields(model)
        filter_fields = []
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection
