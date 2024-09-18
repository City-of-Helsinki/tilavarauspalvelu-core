from graphene_django_extensions import CreateMutation, UpdateMutation

from .permissions import RecurringReservationPermission
from .serializers import (
    RecurringReservationCreateSerializer,
    RecurringReservationUpdateSerializer,
    ReservationSeriesSerializer,
)

__all__ = [
    "RecurringReservationCreateMutation",
    "RecurringReservationUpdateMutation",
]


class ReservationSeriesCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationSeriesSerializer
        permission_classes = [RecurringReservationPermission]


class RecurringReservationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = RecurringReservationCreateSerializer
        permission_classes = [RecurringReservationPermission]


class RecurringReservationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = RecurringReservationUpdateSerializer
        permission_classes = [RecurringReservationPermission]
