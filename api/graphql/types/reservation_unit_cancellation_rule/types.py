from graphene_django_extensions import DjangoNode

from api.graphql.types.reservation_unit_cancellation_rule.filtersets import ReservationUnitCancellationRuleFilterSet
from api.graphql.types.reservation_unit_cancellation_rule.permissions import ReservationUnitCancellationRulePermission
from reservation_units.models import ReservationUnitCancellationRule

__all__ = [
    "ReservationUnitCancellationRuleNode",
]


class ReservationUnitCancellationRuleNode(DjangoNode):
    class Meta:
        model = ReservationUnitCancellationRule
        fields = [
            "pk",
            "name",
            "can_be_cancelled_time_before",
            "needs_handling",
        ]
        filterset_class = ReservationUnitCancellationRuleFilterSet
        permission_classes = [ReservationUnitCancellationRulePermission]
