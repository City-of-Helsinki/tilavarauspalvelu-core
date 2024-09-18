from graphene_django_extensions import DjangoNode

from reservations.models import ReservationPurpose

from .filtersets import ReservationPurposeFilterSet
from .permissions import ReservationPurposePermission

__all__ = [
    "ReservationPurposeNode",
]


class ReservationPurposeNode(DjangoNode):
    class Meta:
        model = ReservationPurpose
        fields = [
            "pk",
            "name",
        ]
        filterset_class = ReservationPurposeFilterSet
        permission_classes = [ReservationPurposePermission]
