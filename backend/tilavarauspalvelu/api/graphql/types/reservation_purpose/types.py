from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationPurpose
from tilavarauspalvelu.typing import AnyUser

from .filtersets import ReservationPurposeFilterSet
from .permissions import ReservationPurposePermission

__all__ = [
    "ReservationPurposeNode",
]


class ReservationPurposeNode(DjangoNode[ReservationPurpose, AnyUser]):
    class Meta:
        model = ReservationPurpose
        fields = [
            "pk",
            "rank",
            "name",
        ]
        filterset_class = ReservationPurposeFilterSet
        permission_classes = [ReservationPurposePermission]
