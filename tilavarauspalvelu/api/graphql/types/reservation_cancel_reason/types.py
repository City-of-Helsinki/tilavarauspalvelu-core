from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated

from tilavarauspalvelu.models import ReservationCancelReason

from .filersets import ReservationCancelReasonFilterSet

__all__ = [
    "ReservationCancelReasonNode",
]


class ReservationCancelReasonNode(DjangoNode):
    class Meta:
        model = ReservationCancelReason
        fields = [
            "pk",
            "reason",
        ]
        filterset_class = ReservationCancelReasonFilterSet
        permission_classes = [AllowAuthenticated]
