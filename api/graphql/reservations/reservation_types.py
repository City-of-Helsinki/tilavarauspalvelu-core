import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_type import PrimaryKeyObjectType
from reservations.models import Reservation


class ReservationType(AuthNode, PrimaryKeyObjectType):
    class Meta:
        model = Reservation

        interfaces = (graphene.relay.Node,)
