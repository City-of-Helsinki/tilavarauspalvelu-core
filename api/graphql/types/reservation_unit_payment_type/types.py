import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from reservation_units.models import ReservationUnitPaymentType


def get_payment_type_codes() -> list[str]:
    return [payment_type.code for payment_type in ReservationUnitPaymentType.objects.all()]


class ReservationUnitPaymentTypeType(AuthNode, OldPrimaryKeyObjectType):
    code = graphene.Field(
        graphene.String,
        description=f"Available values: {', '.join(value for value in get_payment_type_codes())}",
    )

    class Meta:
        model = ReservationUnitPaymentType
        fields = ["code"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
