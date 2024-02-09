import graphene

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from reservation_units.models import ReservationUnitType as ReservationUnitTypeModel


class ReservationUnitTypeType(OldPrimaryKeyObjectType):
    class Meta:
        model = ReservationUnitTypeModel
        fields = ["pk", "rank", *get_all_translatable_fields(model)]
        filter_fields = get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
