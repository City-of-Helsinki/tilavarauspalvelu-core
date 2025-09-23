from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitCancellationRule

from .filtersets import ReservationUnitCancellationRuleFilterSet
from .permissions import ReservationUnitCancellationRulePermission

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
        ]
        filterset_class = ReservationUnitCancellationRuleFilterSet
        permission_classes = [ReservationUnitCancellationRulePermission]
