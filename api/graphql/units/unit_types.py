import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.opening_hours.opening_hours_types import OpeningHoursMixin
from api.graphql.translate_fields import get_all_translatable_fields
from permissions.api_permissions.graphene_field_decorators import (
    check_resolver_permission,
)
from permissions.api_permissions.graphene_permissions import (
    ReservationUnitPermission,
    SpacePermission,
    UnitPermission,
)
from permissions.helpers import can_manage_units
from spaces.models import Unit, UnitGroup


class UnitType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (UnitPermission,)

    # avoid circulars and use path.
    reservation_units = graphene.List("api.graphql.reservation_units.reservation_unit_types.ReservationUnitType")
    spaces = graphene.List("api.graphql.spaces.space_types.SpaceType")
    location = graphene.Field("api.graphql.spaces.space_types.LocationType")
    service_sectors = graphene.List("api.graphql.application_rounds.application_round_types.ServiceSectorType")
    payment_merchant = graphene.Field("api.graphql.merchants.merchant_types.PaymentMerchantType")

    class Meta:
        model = Unit
        fields = [
            "pk",
            "tprek_id",
            "web_page",
            "email",
            "phone",
            "payment_merchant",
        ] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    @check_resolver_permission(ReservationUnitPermission)
    def resolve_reservation_units(self, info):
        return self.reservationunit_set.all()

    @check_resolver_permission(SpacePermission)
    def resolve_spaces(self, info):
        return self.spaces.all()

    def resolve_location(self, info):
        return getattr(self, "location", None)

    def resolve_service_sectors(self, info):
        return self.service_sectors.all()

    def resolve_payment_merchant(self, info):
        if can_manage_units(info.context.user, self):
            return self.payment_merchant
        return None


class UnitByPkType(UnitType, OpeningHoursMixin):
    permission_classes = (UnitPermission,)
    hauki_origin_id = "tprek"

    class Meta:
        model = Unit
        fields = [
            "pk",
            "tprek_id",
            "web_page",
            "email",
            "phone",
        ] + get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class UnitGroupType(AuthNode, PrimaryKeyObjectType):
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
        connection_class = TilavarausBaseConnection

    def resolve_units(self, info: graphene.ResolveInfo):
        return self.units.all()
