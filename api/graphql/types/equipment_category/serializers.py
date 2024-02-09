from graphql import GraphQLError
from rest_framework import serializers

from api.graphql.extensions.legacy_helpers import (
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
    get_all_translatable_fields,
)
from api.graphql.types.equipment.serializers import EquipmentSerializer
from reservation_units.models import EquipmentCategory


class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = [
            "id",
            "name",
        ]


class EquipmentCategoryCreateSerializer(EquipmentCategorySerializer, OldPrimaryKeySerializer):
    class Meta(EquipmentCategorySerializer.Meta):
        fields = ["pk", *get_all_translatable_fields(EquipmentSerializer.Meta.model)]

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name_fi:
            raise GraphQLError("nameFi is required.")

        return data


class EquipmentCategoryUpdateSerializer(OldPrimaryKeyUpdateSerializer, EquipmentCategoryCreateSerializer):
    class Meta(EquipmentCategoryCreateSerializer.Meta):
        fields = [*EquipmentCategoryCreateSerializer.Meta.fields, "pk"]
