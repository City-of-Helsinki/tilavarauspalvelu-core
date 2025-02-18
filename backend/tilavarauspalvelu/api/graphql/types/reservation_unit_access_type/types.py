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
            "begin_date",
            "access_type",
            "reservation_unit",
        ]
        filterset_class = ReservationUnitAccessTypeFilterSet
        permission_classes = [ReservationUnitAccessTypePermission]
