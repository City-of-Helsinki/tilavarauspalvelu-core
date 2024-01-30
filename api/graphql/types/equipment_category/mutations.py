import graphene
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.equipment_category.permissions import EquipmentCategoryPermission
from api.graphql.types.equipment_category.serializers import (
    EquipmentCategoryCreateSerializer,
    EquipmentCategoryUpdateSerializer,
)
from api.graphql.types.equipment_category.types import EquipmentCategoryType
from reservation_units.models import EquipmentCategory


class EquipmentCategoryCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment_category = graphene.Field(EquipmentCategoryType)

    permission_classes = (EquipmentCategoryPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = EquipmentCategoryCreateSerializer


class EquipmentCategoryUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment_category = graphene.Field(EquipmentCategoryType)

    permission_classes = (EquipmentCategoryPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = EquipmentCategoryUpdateSerializer


class EquipmentCategoryDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (EquipmentCategoryPermission,)
    model = EquipmentCategory

    @classmethod
    def validate(cls, root, info, **input):
        return None
