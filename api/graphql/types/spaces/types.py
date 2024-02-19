import graphene
from graphene_django_extensions.fields import RelatedField
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.extensions.permission_helpers import (
    check_resolver_permission,
)
from api.graphql.types.resources.permissions import ResourcePermission
from api.graphql.types.spaces.permissions import SpacePermission
from api.graphql.types.units.types import UnitByPkType
from common.typing import GQLInfo
from spaces.models import Building, Location, RealEstate, ServiceSector, Space


class RealEstateType(OldPrimaryKeyObjectType):
    class Meta:
        model = RealEstate
        fields = ["pk", "surface_area", *get_all_translatable_fields(model)]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class BuildingType(OldPrimaryKeyObjectType):
    real_estate = RelatedField(RealEstateType)

    class Meta:
        model = Building
        fields = ["pk", "real_estate", "surface_area", *get_all_translatable_fields(model)]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class SpaceType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (SpacePermission,)
    parent = RelatedField(lambda: SpaceType)
    children = graphene.List(lambda: SpaceType)
    building = RelatedField(BuildingType)
    unit = RelatedField(UnitByPkType)
    resources = graphene.List("api.graphql.types.resources.types.ResourceType")
    surface_area = graphene.Int

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
            *get_all_translatable_fields(model),
        ]

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_children(root: Space, info: GQLInfo):
        return Space.objects.filter(parent=root)

    @check_resolver_permission(ResourcePermission)
    def resolve_resources(root: Space, info: GQLInfo):
        return root.resource_set.all()


class LocationType(OldPrimaryKeyObjectType):
    longitude = graphene.String()
    latitude = graphene.String()

    class Meta:
        model = Location
        fields = ["address_zip", "longitude", "latitude", *get_all_translatable_fields(model)]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_longitude(root: Location, info: GQLInfo):
        return root.lon

    def resolve_latitude(root: Location, info: GQLInfo):
        return root.lat


class ServiceSectorType(OldPrimaryKeyObjectType):
    class Meta:
        model = ServiceSector
        fields = ["id", *get_all_translatable_fields(model)]
        filter_fields = []
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
