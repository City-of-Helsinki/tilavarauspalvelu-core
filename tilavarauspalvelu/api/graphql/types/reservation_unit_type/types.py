from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitType

from .filtersets import ReservationUnitTypeFilterSet
from .permissions import ReservationUnitTypePermission

__all__ = [
    "ReservationUnitTypeNode",
]


class ReservationUnitTypeNode(DjangoNode):
    class Meta:
        model = ReservationUnitType
        fields = [
            "pk",
            "name",
            "rank",
        ]
        filterset_class = ReservationUnitTypeFilterSet
        permission_classes = [ReservationUnitTypePermission]
