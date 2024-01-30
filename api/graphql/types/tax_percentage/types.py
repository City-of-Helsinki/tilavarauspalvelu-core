import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from reservation_units.models import TaxPercentage


class TaxPercentageType(AuthNode, OldPrimaryKeyObjectType):
    class Meta:
        model = TaxPercentage
        fields = ["pk", "value"]
        filter_fields = ["value"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
