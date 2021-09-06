import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from permissions.api_permissions.graphene_permissions import UnitPermission
from spaces.models import Unit


class UnitType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (UnitPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    # avoid circulars and use path.
    reservation_units = graphene.List(
        "api.graphql.reservation_units.reservation_unit_types.ReservationUnitType"
    )
    spaces = graphene.List("api.graphql.spaces.space_types.SpaceType")
    location = graphene.Field("api.graphql.spaces.space_types.LocationType")

    class Meta:
        model = Unit
        fields = (
            "id",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
        )

        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)

    def resolve_reservation_units(self, info):
        return self.reservationunit_set.all()

    def resolve_spaces(self, info):
        return self.spaces.all()

    def resolve_location(self, info):
        return getattr(self, "location", None)
