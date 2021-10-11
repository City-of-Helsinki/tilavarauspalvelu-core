import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.translate_fields import get_all_translatable_fields
from permissions.api_permissions.graphene_permissions import SpacePermission
from spaces.models import Building, District, Location, RealEstate, Space


class DistrictType(PrimaryKeyObjectType):
    class Meta:
        model = District
        fields = ["id"] + get_all_translatable_fields(model)
        interfaces = (graphene.relay.Node,)


class RealEstateType(PrimaryKeyObjectType):
    class Meta:
        model = RealEstate
        fields = ["id", "district", "surface_area"] + get_all_translatable_fields(model)
        interfaces = (graphene.relay.Node,)


class BuildingType(PrimaryKeyObjectType):
    district = DistrictType()
    real_estate = RealEstateType()

    class Meta:
        model = Building
        fields = [
            "id",
            "district",
            "real_estate",
            "surface_area",
        ] + get_all_translatable_fields(model)
        interfaces = (graphene.relay.Node,)


class SpaceType(AuthNode, PrimaryKeyObjectType):

    permission_classes = (
        (SpacePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )
    children = graphene.List(lambda: SpaceType)
    resources = graphene.List("api.graphql.resources.resource_types.ResourceType")

    class Meta:
        model = Space
        fields = [
            "id",
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

    def resolve_children(self, info):
        return Space.objects.filter(parent=self)

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
