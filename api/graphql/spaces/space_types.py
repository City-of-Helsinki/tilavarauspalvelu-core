import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_type import PrimaryKeyObjectType
from permissions.api_permissions.graphene_permissions import SpacePermission
from spaces.models import Building, District, Location, RealEstate, Space


class DistrictType(PrimaryKeyObjectType):
    class Meta:
        model = District
        fields = ("id", "name")

        interfaces = (graphene.relay.Node,)


class RealEstateType(PrimaryKeyObjectType):
    class Meta:
        model = RealEstate
        fields = ("id", "name", "district", "surface_area")

        interfaces = (graphene.relay.Node,)


class BuildingType(PrimaryKeyObjectType):
    district = DistrictType()
    real_estate = RealEstateType()

    class Meta:
        model = Building
        fields = ("id", "name", "district", "real_estate", "surface_area")

        interfaces = (graphene.relay.Node,)


class SpaceType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (SpacePermission,)

    class Meta:
        model = Space
        fields = (
            "id",
            "name",
            "parent",
            "building",
            "surface_area",
        )

        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)


class LocationType(PrimaryKeyObjectType):
    longitude = graphene.String()
    latitude = graphene.String()

    def resolve_longitude(self, obj):
        return self.lon

    def resolve_latitude(self, obj):
        return self.lat

    class Meta:
        model = Location
        fields = (
            "address_street",
            "address_zip",
            "address_city",
            "longitude",
            "latitude",
        )

        interfaces = (graphene.relay.Node,)
