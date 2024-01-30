import graphene
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.equipment.permissions import EquipmentPermission
from api.graphql.types.equipment.serializers import EquipmentCreateSerializer, EquipmentUpdateSerializer
from api.graphql.types.equipment.types import EquipmentType
from reservation_units.models import Equipment


class EquipmentCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment = graphene.Field(EquipmentType)

    permission_classes = (EquipmentPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = EquipmentCreateSerializer


class EquipmentUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment = graphene.Field(EquipmentType)

    permission_classes = (EquipmentPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = EquipmentUpdateSerializer


class EquipmentDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (EquipmentPermission,)
    model = Equipment

    @classmethod
    def validate(cls, root, info, **input):
        return None
