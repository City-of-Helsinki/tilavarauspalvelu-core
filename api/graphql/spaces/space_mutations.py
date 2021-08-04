import graphene
from graphene_django.rest_framework.mutation import SerializerMutation
from rest_framework.generics import get_object_or_404

from api.graphql.spaces.space_serializers import (
    SpaceCreateSerializer,
    SpaceUpdateSerializer,
)
from api.graphql.spaces.space_types import SpaceType
from spaces.models import Space


class SpaceCreateMutation(SerializerMutation):
    space = graphene.Field(SpaceType)

    class Meta:
        model_operations = ["create"]

        serializer_class = SpaceCreateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        space = serializer.create(serializer.validated_data)
        return cls(errors=None, space=space)


class SpaceUpdateMutation(SerializerMutation):
    space = graphene.Field(SpaceType)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = SpaceUpdateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):

        validated_data = serializer.validated_data
        pk = validated_data.get("pk")
        space = serializer.update(get_object_or_404(Space, pk=pk), validated_data)
        return cls(errors=None, space=space)
