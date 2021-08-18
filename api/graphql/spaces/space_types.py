import graphene
from django.conf import settings
from graphene_django import DjangoObjectType
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.translate_fields import (
    django_type_self_resolver,
    get_translatable_field,
)
from permissions.api_permissions.graphene_permissions import SpacePermission
from spaces.models import Building, District, Location, RealEstate, Space


class DistrictNameField(DjangoObjectType):
    class Meta:
        model = District
        fields = get_translatable_field(model, "name")


class DistrictType(PrimaryKeyObjectType):
    name = graphene.Field(DistrictNameField, resolver=django_type_self_resolver)

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


class SpaceNameField(DjangoObjectType):
    class Meta:
        model = Space
        fields = get_translatable_field(model, "name")


class SpaceType(AuthNode, PrimaryKeyObjectType):

    permission_classes = (
        (SpacePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )
    children = graphene.List(lambda: SpaceType)
    resources = graphene.List("api.graphql.resources.resource_types.ResourceType")

    name = graphene.Field(SpaceNameField, resolver=django_type_self_resolver)

    class Meta:
        model = Space
        fields = (
            "id",
            "name",
            "parent",
            "building",
            "surface_area",
            "terms_of_use",
            "unit",
            "code",
            "max_persons",
            "parent",
        )

        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
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
        fields = (
            "address_street",
            "address_zip",
            "address_city",
            "longitude",
            "latitude",
        )

        interfaces = (graphene.relay.Node,)
