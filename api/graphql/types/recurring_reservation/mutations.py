from api.graphql.extensions.base_mutations import CreateAuthMutation, UpdateAuthMutation
from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from api.graphql.types.recurring_reservation.serializers import (
    RecurringReservationCreateSerializer,
    RecurringReservationUpdateSerializer,
)


class RecurringReservationCreateMutation(CreateAuthMutation):
    class Meta:
        serializer_class = RecurringReservationCreateSerializer
        permission_classes = (RecurringReservationPermission,)


class RecurringReservationUpdateMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = RecurringReservationUpdateSerializer
        permission_classes = (RecurringReservationPermission,)
