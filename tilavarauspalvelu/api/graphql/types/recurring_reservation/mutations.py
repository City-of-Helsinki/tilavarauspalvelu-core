from graphene_django_extensions import CreateMutation, UpdateMutation

from .permissions import RecurringReservationPermission
from .serializers import (
    ReservationSeriesCreateSerializer,
    ReservationSeriesRescheduleSerializer,
    ReservationSeriesUpdateSerializer,
)

__all__ = [
    "ReservationSeriesCreateMutation",
    "ReservationSeriesRescheduleMutation",
    "ReservationSeriesUpdateMutation",
]


class ReservationSeriesCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationSeriesCreateSerializer
        permission_classes = [RecurringReservationPermission]


class ReservationSeriesUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationSeriesUpdateSerializer
        permission_classes = [RecurringReservationPermission]


class ReservationSeriesRescheduleMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationSeriesRescheduleSerializer
        permission_classes = [RecurringReservationPermission]
