import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.reservation_unit_cancellation_rule.permissions import ReservationUnitCancellationRulePermission
from common.typing import GQLInfo
from reservation_units.models import ReservationUnitCancellationRule


class ReservationUnitCancellationRuleType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (ReservationUnitCancellationRulePermission,)

    class Meta:
        model = ReservationUnitCancellationRule
        fields = ["pk", "can_be_cancelled_time_before", "needs_handling", *get_all_translatable_fields(model)]
        filter_fields = ["name"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_can_be_cancelled_time_before(root: ReservationUnitCancellationRule, info: GQLInfo):
        if not root.can_be_cancelled_time_before:
            return None
        return root.can_be_cancelled_time_before.total_seconds()
