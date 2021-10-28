import django_filters
import graphene
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from graphene import Field, relay
from graphene_permissions.mixins import AuthFilter
from graphene_permissions.permissions import AllowAny, AllowAuthenticated
from rest_framework.generics import get_object_or_404

from api.graphql.reservation_units.reservation_unit_filtersets import (
    ReservationUnitsFilterSet,
)
from api.graphql.reservation_units.reservation_unit_mutations import (
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
    EquipmentCreateMutation,
    EquipmentDeleteMutation,
    EquipmentUpdateMutation,
    PurposeCreateMutation,
    PurposeUpdateMutation,
    ReservationUnitCreateMutation,
    ReservationUnitUpdateMutation,
)
from api.graphql.reservation_units.reservation_unit_types import (
    EquipmentCategoryType,
    EquipmentType,
    KeywordCategoryType,
    KeywordGroupType,
    KeywordType,
    PurposeType,
    ReservationUnitByPkType,
    ReservationUnitType,
)
from api.graphql.reservations.reservation_filtersets import ReservationFilterSet
from api.graphql.reservations.reservation_mutations import (
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationUpdateMutation,
)
from api.graphql.reservations.reservation_types import ReservationType
from api.graphql.resources.resource_mutations import (
    ResourceCreateMutation,
    ResourceDeleteMutation,
    ResourceUpdateMutation,
)
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
    EquipmentCategoryPermission,
    EquipmentPermission,
    KeywordPermission,
    PurposePermission,
    ReservationPermission,
    ReservationUnitPermission,
    ResourcePermission,
    SpacePermission,
    UnitPermission,
)
from permissions.helpers import (
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
from reservation_units.models import Equipment, EquipmentCategory, ReservationUnit
from resources.models import Resource
from spaces.models import ServiceSector, Space, Unit


class AllowAuthenticatedFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class ReservationsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (
        (ReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    @classmethod
    def resolve_queryset(
        cls, connection, iterable, info, args, filtering_args, filterset_class
    ):
        queryset = super().resolve_queryset(
            connection, iterable, info, args, filtering_args, filterset_class
        )

        user = info.context.user
        viewable_units = get_units_where_can_view_reservations(user)
        viewable_service_sectors = get_service_sectors_where_can_view_reservations(user)
        if settings.TMP_PERMISSIONS_DISABLED:
            viewable_units = Unit.objects.all()
            viewable_service_sectors = ServiceSector.objects.all()
            user = (
                get_user_model().objects.get(username="admin")
                if settings.TMP_PERMISSIONS_DISABLED
                else info.context.user
            )
        elif user.is_anonymous:
            return queryset.none()
        return queryset.filter(
            Q(reservation_unit__unit__in=viewable_units)
            | Q(reservation_unit__unit__service_sectors__in=viewable_service_sectors)
            | Q(user=user)
        ).order_by("begin")


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


class EquipmentFilter(AuthFilter):
    permission_classes = (
        (EquipmentPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )


class EquipmentCategoryFilter(AuthFilter):
    permission_classes = (
        (EquipmentCategoryPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )


class PurposeFilter(AuthFilter):
    permission_classes = (
        (PurposePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )


class Query(graphene.ObjectType):
    reservations = ReservationsFilter(
        ReservationType, filterset_class=ReservationFilterSet
    )

    reservation_units = ReservationUnitsFilter(
        ReservationUnitType, filterset_class=ReservationUnitsFilterSet
    )
    reservation_unit = relay.Node.Field(ReservationUnitType)
    reservation_unit_by_pk = Field(ReservationUnitByPkType, pk=graphene.Int())

    resources = ResourcesFilter(ResourceType)
    resource = relay.Node.Field(ResourceType)
    resource_by_pk = Field(ResourceType, pk=graphene.Int())

    equipments = EquipmentFilter(EquipmentType)
    equipment = relay.Node.Field((EquipmentType))
    equipment_by_pk = Field(EquipmentType, pk=graphene.Int())

    equipment_categories = EquipmentCategoryFilter(EquipmentCategoryType)
    equipment_category = relay.Node.Field((EquipmentCategoryType))
    equipment_category_by_pk = Field(EquipmentCategoryType, pk=graphene.Int())

    spaces = SpacesFilter(SpaceType)
    space = relay.Node.Field(SpaceType)
    space_by_pk = Field(SpaceType, pk=graphene.Int())

    units = UnitsFilter(UnitType)
    unit = relay.Node.Field(UnitType)
    unit_by_pk = Field(UnitByPkType, pk=graphene.Int())

    keyword_categories = KeywordFilter(KeywordCategoryType)
    keyword_groups = KeywordFilter(KeywordGroupType)
    keywords = KeywordFilter(KeywordType)

    purposes = PurposeFilter(PurposeType)

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

    def resolve_equipment_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Equipment, pk=pk)

    def resolve_equipment_category_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(EquipmentCategory, pk=pk)


class Mutation(graphene.ObjectType):
    create_reservation = ReservationCreateMutation.Field()
    update_reservation = ReservationUpdateMutation.Field()
    confirm_reservation = ReservationConfirmMutation.Field()

    create_reservation_unit = ReservationUnitCreateMutation.Field()
    update_reservation_unit = ReservationUnitUpdateMutation.Field()

    create_purpose = PurposeCreateMutation.Field()
    update_purpose = PurposeUpdateMutation.Field()

    create_equipment = EquipmentCreateMutation.Field()
    update_equipment = EquipmentUpdateMutation.Field()
    delete_equipment = EquipmentDeleteMutation.Field()

    create_equipment_category = EquipmentCategoryCreateMutation.Field()
    update_equipment_category = EquipmentCategoryUpdateMutation.Field()
    delete_equipment_category = EquipmentCategoryDeleteMutation.Field()

    create_space = SpaceCreateMutation.Field()
    update_space = SpaceUpdateMutation.Field()
    delete_space = SpaceDeleteMutation.Field()

    create_resource = ResourceCreateMutation.Field()
    update_resource = ResourceUpdateMutation.Field()
    delete_resource = ResourceDeleteMutation.Field()

    update_unit = UnitUpdateMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
