import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.extensions.permission_helpers import check_resolver_permission
from api.graphql.types.reservation_units.permissions import ReservationUnitPermission
from api.graphql.types.spaces.permissions import SpacePermission
from api.graphql.types.units.permissions import UnitPermission
from common.typing import GQLInfo
from permissions.helpers import can_manage_units
from spaces.models import Unit, UnitGroup


class UnitType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (UnitPermission,)

    # avoid circulars and use path.
    reservation_units = graphene.List("api.graphql.types.reservation_units.types.ReservationUnitType")
    spaces = graphene.List("api.graphql.types.spaces.types.SpaceType")
    location = graphene.Field("api.graphql.types.spaces.types.LocationType")
    service_sectors = graphene.List("api.graphql.types.spaces.types.ServiceSectorType")
    payment_merchant = graphene.Field("api.graphql.types.merchants.types.PaymentMerchantType")

    class Meta:
        model = Unit
        fields = [
            "pk",
            "tprek_id",
            "web_page",
            "email",
            "phone",
            "payment_merchant",
            *get_all_translatable_fields(model),
        ]

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    @check_resolver_permission(ReservationUnitPermission)
    def resolve_reservation_units(root: Unit, info: GQLInfo):
        return root.reservationunit_set.all()

    @check_resolver_permission(SpacePermission)
    def resolve_spaces(root: Unit, info: GQLInfo):
        return root.spaces.all()

    def resolve_location(root: Unit, info: GQLInfo):
        return getattr(root, "location", None)

    def resolve_service_sectors(root: Unit, info: GQLInfo):
        return root.service_sectors.all()

    def resolve_payment_merchant(root: Unit, info: GQLInfo):
        if can_manage_units(info.context.user, root):
            return root.payment_merchant
        return None


class UnitByPkType(UnitType):
    permission_classes = (UnitPermission,)

    class Meta:
        model = Unit
        fields = ["pk", "tprek_id", "web_page", "email", "phone", *get_all_translatable_fields(model)]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class UnitGroupType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (UnitPermission,)

    units = graphene.List(UnitType)

    class Meta:
        model = UnitGroup
        fields = [
            "pk",
            "name",
            "units",
        ]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_units(root: UnitGroup, info: GQLInfo):
        return root.units.all()
