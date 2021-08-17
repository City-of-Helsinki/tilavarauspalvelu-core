import graphene
from easy_thumbnails.files import get_thumbnailer
from graphene_django import DjangoObjectType
from graphene_permissions.mixins import AuthNode

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.resources.resource_types import ResourceType
from api.graphql.services.service_types import ServiceType
from api.graphql.spaces.space_types import LocationType, SpaceType
from api.graphql.units.unit_types import UnitType
from permissions.api_permissions.graphene_permissions import ReservationUnitPermission
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
    ReservationUnitImage,
)
from reservation_units.models import ReservationUnitType as ReservationUnitTypeModel
from resources.models import Resource
from spaces.models import Space


class PurposeType(AuthNode, PrimaryKeyObjectType):
    class Meta:
        model = Purpose
        fields = ("id", "name", "pk")

        interfaces = (graphene.relay.Node,)


class ReservationUnitImageType(DjangoObjectType):
    image_url = graphene.String()
    medium_url = graphene.String()
    small_url = graphene.String()

    class Meta:
        model = ReservationUnitImage
        fields = ("image_url", "medium_url", "small_url", "image_type")

    def resolve_image_url(self, info):
        if not self.image:
            return None
        return info.context.build_absolute_uri(self.image.url)

    def resolve_small_url(self, info):
        if not self.image:
            return None
        url = get_thumbnailer(self.image)["small"].url

        return info.context.build_absolute_uri(url)

    def resolve_medium_url(self, info):
        if not self.image:
            return None
        url = get_thumbnailer(self.image)["medium"].url

        return info.context.build_absolute_uri(url)


class ReservationUnitTypeType(PrimaryKeyObjectType):
    class Meta:
        model = ReservationUnitTypeModel
        fields = ("name", "id")

        interfaces = (graphene.relay.Node,)


class EquipmentCategoryType(PrimaryKeyObjectType):
    class Meta:
        model = EquipmentCategory
        fields = ("name", "id")

        interfaces = (graphene.relay.Node,)


class EquipmentType(PrimaryKeyObjectType):
    category = graphene.Field(EquipmentCategoryType)

    class Meta:
        model = Equipment
        fields = ("name", "id")

        interfaces = (graphene.relay.Node,)

    def resolve_category(self, info):
        return self.category


class ReservationUnitType(AuthNode, PrimaryKeyObjectType):
    pk = graphene.Int()
    spaces = graphene.List(SpaceType)
    resources = graphene.List(ResourceType)
    services = graphene.List(ServiceType)
    purposes = graphene.List(PurposeType)
    images = graphene.List(ReservationUnitImageType)
    location = graphene.Field(LocationType)
    reservation_unit_type = graphene.Field(ReservationUnitTypeType)
    equipment = graphene.List(EquipmentType)
    unit = graphene.Field(UnitType)
    max_persons = graphene.Int()

    permission_classes = (ReservationUnitPermission,)

    class Meta:
        model = ReservationUnit
        fields = (
            "id",
            "name",
            "description",
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "purposes",
            "images",
            "location",
            "max_persons",
            "reservation_unit_type",
            "terms_of_use",
            "equipment",
            "uuid",
            "contact_information",
        )
        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
            "description": ["exact", "icontains"],
        }

        interfaces = (graphene.relay.Node,)

    def resolve_pk(self, info):
        return self.id

    def resolve_location(self, info):
        return self.get_location()

    def resolve_spaces(self, info):
        return Space.objects.filter(reservation_units=self.id).select_related(
            "parent", "building"
        )

    def resolve_services(self, info):
        return self.services.all()

    def resolve_purposes(self, info):
        return Purpose.objects.filter(reservation_units=self.id)

    def resolve_images(self, info):
        return ReservationUnitImage.objects.filter(reservation_unit_id=self.id)

    def resolve_resources(self, info):
        return Resource.objects.filter(reservation_units=self.id)

    def resolve_reservation_unit_type(self, info):
        return self.reservation_unit_type

    def resolve_equipment(self, info):
        if self.equipments is None:
            return []
        return self.equipments.all()

    def resolve_unit(self, info):
        return self.unit

    def resolve_max_persons(self, info):
        return self.get_max_persons()
