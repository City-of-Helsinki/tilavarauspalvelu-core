from __future__ import annotations

from tilavarauspalvelu.models import ReservationDenyReason

from .filtersets import ReservationDenyReasonFilterSet

__all__ = [
    "ReservationDenyReasonNode",
]


class ReservationDenyReasonNode(DjangoNode):
    class Meta:
        model = ReservationDenyReason
        fields = [
            "pk",
            "reason",
        ]
        filterset_class = ReservationDenyReasonFilterSet
        permission_classes = [AllowAuthenticated]
