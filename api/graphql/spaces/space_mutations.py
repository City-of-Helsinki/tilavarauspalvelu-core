import graphene
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.base_mutations import AuthDeleteMutation, AuthSerializerMutation
from api.graphql.spaces.space_serializers import (
    SpaceCreateSerializer,
    SpaceUpdateSerializer,
)
from api.graphql.spaces.space_types import SpaceType
from applications.models import ApplicationRound, ApplicationRoundStatus
from permissions.api_permissions.graphene_permissions import SpacePermission
from spaces.models import Space


class SpaceCreateMutation(AuthSerializerMutation, SerializerMutation):
    space = graphene.Field(SpaceType)

    permission_classes = (SpacePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = SpaceCreateSerializer


class SpaceUpdateMutation(AuthSerializerMutation, SerializerMutation):
    space = graphene.Field(SpaceType)

    permission_classes = (SpacePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = SpaceUpdateSerializer


class SpaceDeleteMutation(AuthDeleteMutation, ClientIDMutation):
    permission_classes = (SpacePermission,)
    model = Space

    @classmethod
    def validate(self, root, info, **input):
        space = get_object_or_404(Space, pk=input.get("pk", None))
        in_active_round = (
            ApplicationRound.objects.exclude(
                statuses__status__in=ApplicationRoundStatus.CLOSED_STATUSES
            )
            .filter(reservation_units__spaces=space)
            .exists()
        )
        if in_active_round:
            raise ValidationError("Space occurs in active application round.")

        return None
