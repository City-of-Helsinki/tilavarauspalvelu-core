import graphene
from graphene_django import DjangoObjectType

from spaces.models import Building, District, Location, RealEstate, Space, Unit


class DistrictType(DjangoObjectType):
    class Meta:
        model = District
        fields = ("id", "name")


class RealEstateType(DjangoObjectType):
    class Meta:
        model = RealEstate
        fields = ("id", "name", "district", "area")


class BuildingType(DjangoObjectType):
    district = DistrictType()
    real_estate = RealEstateType()

    class Meta:
        model = Building
        fields = ("id", "name", "district", "real_estate", "surface_area")


class SpaceType(DjangoObjectType):
    class Meta:
        model = Space
        fields = (
            "id",
            "name",
            "parent",
            "building",
            "surface_area",
        )


class LocationType(DjangoObjectType):
    longitude = graphene.String()
    latitude = graphene.String()

    def resolve_longitude(self, obj):
        return self.lon

    def resolve_latitude(self, obj):
        return self.lat

    class Meta:
        model = Location
        fields = [
            "address_street",
            "address_zip",
            "address_city",
            "longitude",
            "latitude",
        ]


class UnitType(DjangoObjectType):
    class Meta:
        model = Unit
        fields = [
            "id",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
        ]
