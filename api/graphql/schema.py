import django_filters
import graphene
from django.conf import settings
from graphene import Field, relay
from graphene_django.forms.mutation import DjangoModelFormMutation
from graphene_permissions.mixins import AuthFilter, AuthMutation
from graphene_permissions.permissions import AllowAny, AllowAuthenticated
from rest_framework.generics import get_object_or_404

from api.graphql.reservation_units.reservation_unit_filtersets import (
    ReservationUnitsFilterSet,
)
from api.graphql.reservation_units.reservation_unit_mutations import (
    PurposeCreateMutation,
    PurposeUpdateMutation,
    ReservationUnitCreateMutation,
    ReservationUnitUpdateMutation,
)
from api.graphql.reservation_units.reservation_unit_types import (
    KeywordCategoryType,
    KeywordGroupType,
    KeywordType,
    ReservationUnitByPkType,
    ReservationUnitType,
)
from api.graphql.reservations.reservation_types import ReservationType
from api.graphql.resources.resource_types import ResourceType
from api.graphql.spaces.space_mutations import (
    SpaceCreateMutation,
    SpaceDeleteMutation,
    SpaceUpdateMutation,
)
from api.graphql.spaces.space_types import SpaceType
from api.graphql.units.unit_mutations import UnitUpdateMutation
from api.graphql.units.unit_types import UnitByPkType, UnitType
from permissions.api_permissions.graphene_permissions import (
    KeywordPermission,
    ReservationUnitPermission,
    ResourcePermission,
    SpacePermission,
    UnitPermission,
)
from reservation_units.models import ReservationUnit
from reservations.forms import ReservationForm
from resources.models import Resource
from spaces.models import Space, Unit


class ReservationMutation(AuthMutation, DjangoModelFormMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (
        (ReservationUnitPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        form_class = ReservationForm


class AllowAuthenticatedFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class ReservationUnitsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (
        (ReservationUnitPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )


class ResourcesFilter(AuthFilter):
    permission_classes = (
        (ResourcePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )


class SpacesFilter(AuthFilter):
    permission_classes = (
        (SpacePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )


class UnitsFilter(AuthFilter):
    permission_classes = (
        (UnitPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )


class KeywordFilter(AuthFilter):
    permission_classes = (
        (KeywordPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )


class Query(graphene.ObjectType):
    reservation_units = ReservationUnitsFilter(
        ReservationUnitType, filterset_class=ReservationUnitsFilterSet
    )
    reservation_unit = relay.Node.Field(ReservationUnitType)
    reservation_unit_by_pk = Field(ReservationUnitByPkType, pk=graphene.Int())

    resources = ResourcesFilter(ResourceType)
    resource = relay.Node.Field(ResourceType)
    resource_by_pk = Field(ResourceType, pk=graphene.Int())

    spaces = SpacesFilter(SpaceType)
    space = relay.Node.Field(SpaceType)
    space_by_pk = Field(SpaceType, pk=graphene.Int())

    units = UnitsFilter(UnitType)
    unit = relay.Node.Field(UnitType)
    unit_by_pk = Field(UnitByPkType, pk=graphene.Int())

    keyword_categories = KeywordFilter(KeywordCategoryType)
    keyword_groups = KeywordFilter(KeywordGroupType)
    keywords = KeywordFilter(KeywordType)

    def resolve_reservation_unit_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(ReservationUnit, pk=pk)

    def resolve_resource_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Resource, pk=pk)

    def resolve_unit_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Unit, pk=pk)

    def resolve_space_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Space, pk=pk)


class Mutation(graphene.ObjectType):
    create_reservation = ReservationMutation.Field()

    create_reservation_unit = ReservationUnitCreateMutation.Field()
    update_reservation_unit = ReservationUnitUpdateMutation.Field()

    create_purpose = PurposeCreateMutation.Field()
    update_purpose = PurposeUpdateMutation.Field()

    create_space = SpaceCreateMutation.Field()
    update_space = SpaceUpdateMutation.Field()
    delete_space = SpaceDeleteMutation.Field()

    update_unit = UnitUpdateMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
