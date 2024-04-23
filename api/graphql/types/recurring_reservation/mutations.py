from graphene_django_extensions import CreateMutation, UpdateMutation

from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from api.graphql.types.recurring_reservation.serializers import (
    RecurringReservationCreateSerializer,
    RecurringReservationUpdateSerializer,
)

__all__ = [
    "RecurringReservationCreateMutation",
    "RecurringReservationUpdateMutation",
]


class RecurringReservationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = RecurringReservationCreateSerializer
        permission_classes = [RecurringReservationPermission]


class RecurringReservationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = RecurringReservationUpdateSerializer
        permission_classes = [RecurringReservationPermission]
