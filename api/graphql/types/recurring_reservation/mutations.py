from graphene_django_extensions import CreateMutation, UpdateMutation

from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from api.graphql.types.recurring_reservation.serializers import RecurringReservationSerializer

__all__ = [
    "RecurringReservationCreateMutation",
    "RecurringReservationUpdateMutation",
]


class RecurringReservationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = RecurringReservationSerializer
        permission_classes = [RecurringReservationPermission]


class RecurringReservationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = RecurringReservationSerializer
        permission_classes = [RecurringReservationPermission]
