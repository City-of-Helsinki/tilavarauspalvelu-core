import graphene
from graphene_django.rest_framework.mutation import SerializerMutation
from rest_framework.generics import get_object_or_404

from api.graphql.extensions.legacy_helpers import OldAuthSerializerMutation
from api.graphql.types.purpose.permissions import PurposePermission
from api.graphql.types.purpose.serializers import PurposeCreateSerializer, PurposeUpdateSerializer
from api.graphql.types.purpose.types import PurposeType
from reservation_units.models import Purpose


class PurposeCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (PurposePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = PurposeCreateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        purpose = serializer.create(serializer.validated_data)
        return cls(errors=None, purpose=purpose)


class PurposeUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (PurposePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = PurposeUpdateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        validated_data = serializer.validated_data
        pk = validated_data.get("pk")
        purpose = serializer.update(get_object_or_404(Purpose, pk=pk), validated_data)
        return cls(errors=None, purpose=purpose)
