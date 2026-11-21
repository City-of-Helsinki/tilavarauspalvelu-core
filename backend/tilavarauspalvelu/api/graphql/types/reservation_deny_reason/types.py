from __future__ import annotations

from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated

from tilavarauspalvelu.models import ReservationDenyReason
from tilavarauspalvelu.typing import AnyUser

from .filtersets import ReservationDenyReasonFilterSet

__all__ = [
    "ReservationDenyReasonNode",
]


class ReservationDenyReasonNode(DjangoNode[ReservationDenyReason, AnyUser]):
    class Meta:
        model = ReservationDenyReason
        fields = [
            "pk",
            "reason",
        ]
        filterset_class = ReservationDenyReasonFilterSet
        permission_classes = [AllowAuthenticated]
