import graphene
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.spaces.permissions import SpacePermission
from api.graphql.types.spaces.serializers import (
    SpaceCreateSerializer,
    SpaceUpdateSerializer,
)
from api.graphql.types.spaces.types import SpaceType
from applications.models import ApplicationRound
from spaces.models import Space


class SpaceCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    space = graphene.Field(SpaceType)

    permission_classes = (SpacePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = SpaceCreateSerializer


class SpaceUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    space = graphene.Field(SpaceType)

    permission_classes = (SpacePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = SpaceUpdateSerializer


class SpaceDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (SpacePermission,)
    model = Space

    @classmethod
    def validate(self, root, info, **input):
        space = get_object_or_404(Space, pk=input.get("pk", None))
        in_active_round = ApplicationRound.objects.active().filter(reservation_units__spaces=space).exists()
        if in_active_round:
            raise ValidationError("Space occurs in active application round.")

        return None
