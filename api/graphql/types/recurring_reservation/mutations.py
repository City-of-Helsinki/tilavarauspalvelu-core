from graphene_django_extensions import CreateMutation, UpdateMutation

from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from api.graphql.types.recurring_reservation.serializers import (
    RecurringReservationUpdateSerializer,
    ReservationSeriesCreateSerializer,
    ReservationSeriesUpdateSerializer,
)

__all__ = [
    "RecurringReservationUpdateMutation",
    "ReservationSeriesCreateMutation",
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


class RecurringReservationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = RecurringReservationUpdateSerializer
        permission_classes = [RecurringReservationPermission]
