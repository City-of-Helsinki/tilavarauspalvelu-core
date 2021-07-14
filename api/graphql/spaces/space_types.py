import graphene

from api.graphql.base_type import PrimaryKeyObjectType
from spaces.models import Building, District, Location, RealEstate, Space, Unit


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


class SpaceType(PrimaryKeyObjectType):
    class Meta:
        model = Space
        fields = (
            "id",
            "name",
            "parent",
            "building",
            "surface_area",
        )

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


class UnitType(PrimaryKeyObjectType):
    class Meta:
        model = Unit
        fields = (
            "id",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
        )

        interfaces = (graphene.relay.Node,)
