import graphene
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthSerializerMutation
from api.graphql.types.recurring_reservation.serializers import (
    RecurringReservationCreateSerializer,
    RecurringReservationUpdateSerializer,
)
from api.graphql.types.reservations.permissions import RecurringReservationPermission
from api.graphql.types.reservations.types import RecurringReservationType
from common.typing import GQLInfo
from reservations.models import RecurringReservation


class RecurringReservationCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    recurring_reservation = graphene.Field(RecurringReservationType)

    permission_classes = (RecurringReservationPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = RecurringReservationCreateSerializer

    def resolve_recurring_reservation(self, info: GQLInfo):
        recurring_reservation = RecurringReservation.objects.filter(pk=self.pk).first()
        return recurring_reservation


class RecurringReservationUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    recurring_reservation = graphene.Field(RecurringReservationType)

    permission_classes = (RecurringReservationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = RecurringReservationUpdateSerializer

    def resolve_recurring_reservation(self, info: GQLInfo):
        recurring_reservation = RecurringReservation.objects.filter(pk=self.pk).first()
        return recurring_reservation
