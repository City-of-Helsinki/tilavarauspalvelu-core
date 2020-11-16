from rest_framework.serializers import Serializer
from services.models import Service
import graphene
from graphene_django import DjangoObjectType
from graphene_django.forms.mutation import DjangoModelFormMutation

from reservation_units.models import ReservationUnit
from spaces.models import Space, Building, District, RealEstate
from resources.models import Resource
from reservations.models import Reservation
from reservations.forms import ReservationForm
from api.reservations_api import ReservationSerializer


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


class ReservationUnitType(DjangoObjectType):
    spaces = graphene.List(SpaceType)
    resources = graphene.List(ResourceType)

    class Meta:
        model = ReservationUnit
        fields = (
            "id",
            "name",
            "spaces",
            "resources",
            "services",
            "require_introduction",
        )

    def resolve_spaces(self, info):
        return Space.objects.filter(reservation_units=self.id).select_related(
            "parent", "building"
        )

    def resolve_resources(self, info):
        return Resource.objects.filter(reservation_units=self.id)


class ReservationType(DjangoObjectType):
    class Meta:
        model = Reservation


class ReservationMutation(DjangoModelFormMutation):
    reservation = graphene.Field(ReservationType)

    class Meta:
        form_class = ReservationForm


class Query(graphene.ObjectType):
    all_reservation_units = graphene.List(ReservationUnitType)

    def resolve_all_reservation_units(root, info):
        return ReservationUnit.objects.all().prefetch_related(
            "spaces", "resources", "services"
        )


class Mutation(graphene.ObjectType):
    create_reservation = ReservationMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
