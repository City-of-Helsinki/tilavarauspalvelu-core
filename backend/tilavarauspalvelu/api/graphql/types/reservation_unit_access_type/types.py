from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitAccessType

from .filtersets import ReservationUnitAccessTypeFilterSet
from .permissions import ReservationUnitAccessTypePermission

__all__ = [
    "ReservationUnitAccessTypeNode",
]


class ReservationUnitAccessTypeNode(DjangoNode):
    class Meta:
        model = ReservationUnitAccessType
        fields = [
            "pk",
            "access_type",
            "begin_date",
        ]
        filterset_class = ReservationUnitAccessTypeFilterSet
        permission_classes = [ReservationUnitAccessTypePermission]
