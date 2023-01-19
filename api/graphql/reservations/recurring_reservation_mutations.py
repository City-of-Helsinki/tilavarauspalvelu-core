import graphene
from graphene import ResolveInfo
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.reservations.recurring_reservation_serializers.create_serializers import (
    RecurringReservationCreateSerializer,
)
from api.graphql.reservations.recurring_reservation_serializers.update_serializers import (
    RecurringReservationUpdateSerializer,
)
from api.graphql.reservations.reservation_types import RecurringReservationType
from permissions.api_permissions.graphene_permissions import (
    RecurringReservationPermission,
)
from reservations.models import RecurringReservation


class RecurringReservationCreateMutation(AuthSerializerMutation, SerializerMutation):
    recurring_reservation = graphene.Field(RecurringReservationType)

    permission_classes = (RecurringReservationPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = RecurringReservationCreateSerializer

    def resolve_recurring_reservation(self, info: ResolveInfo):
        recurring_reservation = RecurringReservation.objects.filter(pk=self.pk).first()
        return recurring_reservation


class RecurringReservationUpdateMutation(AuthSerializerMutation, SerializerMutation):
    recurring_reservation = graphene.Field(RecurringReservationType)

    permission_classes = (RecurringReservationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = RecurringReservationUpdateSerializer

    def resolve_recurring_reservation(self, info: ResolveInfo):
        recurring_reservation = RecurringReservation.objects.filter(pk=self.pk).first()
        return recurring_reservation
