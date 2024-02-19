import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from reservation_units.models import ReservationUnitPaymentType


class ReservationUnitPaymentTypeType(AuthNode, OldPrimaryKeyObjectType):
    code = graphene.Field(graphene.String)

    class Meta:
        model = ReservationUnitPaymentType
        fields = ["code"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
