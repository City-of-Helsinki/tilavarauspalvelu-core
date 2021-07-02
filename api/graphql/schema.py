import graphene
from easy_thumbnails.files import get_thumbnailer
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.forms.mutation import DjangoModelFormMutation
from graphene_permissions.mixins import AuthFilter, AuthNode
from graphene_permissions.permissions import AllowAuthenticated

from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
    ReservationUnitImage,
    ReservationUnitType,
)
from reservations.forms import ReservationForm
from reservations.models import Reservation
from resources.models import Resource
from services.models import Service
from spaces.models import Building, District, Location, RealEstate, Space, Unit


class ServiceType(DjangoObjectType):
    buffer_time_before = graphene.String()
    buffer_time_after = graphene.String()

    class Meta:
        model = Service
        fields = (
            "id",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        )


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
        fields = ("id", "name", "district", "real_estate", "area")


class SpaceType(DjangoObjectType):
    class Meta:
        model = Space
        fields = (
            "id",
            "name",
            "parent",
            "building",
            "area",
        )


class ResourceType(DjangoObjectType):
    building = graphene.List(BuildingType)

    class Meta:
        model = Resource
        fields = (
            "id",
            "location_type",
            "name",
            "space",
            "buffer_time_before",
            "buffer_time_after",
        )


class PurposeType(DjangoObjectType):
    class Meta:
        model = Purpose
        fields = (
            "id",
            "name",
        )


class ReservationUnitImageType(DjangoObjectType):
    image_url = graphene.String()
    medium_url = graphene.String()
    small_url = graphene.String()

    class Meta:
        model = ReservationUnitImage
        fields = ["image_url", "medium_url", "small_url", "image_type"]

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


class ReservationUnitTypeType(DjangoObjectType):
    class Meta:
        model = ReservationUnitType
        fields = ["name", "id"]


class EquipmentCategoryType(DjangoObjectType):
    class Meta:
        model = EquipmentCategory
        fields = ["name", "id"]


class EquipmentType(DjangoObjectType):
    category = graphene.Field(EquipmentCategoryType)

    class Meta:
        model = Equipment
        fields = ["name", "id"]

    def resolve_category(self, info):
        return self.category


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


class ReservationUnitType(AuthNode, DjangoObjectType):
    pk = graphene.Int()
    spaces = graphene.List(SpaceType)
    resources = graphene.List(ResourceType)
    location = graphene.String()
    purposes = graphene.List(PurposeType)
    images = graphene.List(ReservationUnitImageType)
    location = graphene.Field(LocationType)
    reservation_unit_type = graphene.Field(ReservationUnitTypeType)
    equipment = graphene.List(EquipmentType)
    unit = graphene.Field(UnitType)

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
            "purposes" "images",
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

        interfaces = (relay.Node,)

    def resolve_pk(self, info):
        return self.id

    def resolve_location(self, info):
        return self.get_location()

    def resolve_spaces(self, info):
        return Space.objects.filter(reservation_units=self.id).select_related(
            "parent", "building"
        )

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


class ReservationType(DjangoObjectType):
    class Meta:
        model = Reservation


class ReservationMutation(DjangoModelFormMutation):
    reservation = graphene.Field(ReservationType)

    class Meta:
        form_class = ReservationForm


class AllowAuthenticatedFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class Query(graphene.ObjectType):
    reservation_units = DjangoFilterConnectionField(ReservationUnitType)
    reservation_unit = relay.Node.Field(ReservationUnitType)


class Mutation(graphene.ObjectType):
    create_reservation = ReservationMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
