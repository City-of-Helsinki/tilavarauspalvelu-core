import graphene

from api.graphql.base_type import PrimaryKeyObjectType
from reservations.models import Reservation


class ReservationType(PrimaryKeyObjectType):
    class Meta:
        model = Reservation

        interfaces = (graphene.relay.Node,)
