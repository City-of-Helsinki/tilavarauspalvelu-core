import graphene
from django.conf import settings
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.permissions import AllowAny

from api.graphql.base_mutations import AuthDeleteMutation, AuthSerializerMutation
from api.graphql.spaces.space_serializers import (
    SpaceCreateSerializer,
    SpaceUpdateSerializer,
)
from api.graphql.spaces.space_types import SpaceType
from permissions.api_permissions.graphene_permissions import SpacePermission
from spaces.models import Space


class SpaceCreateMutation(AuthSerializerMutation, SerializerMutation):
    space = graphene.Field(SpaceType)

    permission_classes = (
        (SpacePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model_operations = ["create"]

        serializer_class = SpaceCreateSerializer


class SpaceUpdateMutation(AuthSerializerMutation, SerializerMutation):
    space = graphene.Field(SpaceType)

    permission_classes = (
        (SpacePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = SpaceUpdateSerializer


class SpaceDeleteMutation(AuthDeleteMutation, ClientIDMutation):
    permission_classes = (
        (SpacePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )
    model = Space
