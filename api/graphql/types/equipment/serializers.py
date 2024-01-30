from graphql import GraphQLError
from rest_framework import serializers

from api.graphql.extensions.legacy_helpers import (
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
    get_all_translatable_fields,
)
from common.fields.serializer import IntegerPrimaryKeyField
from reservation_units.models import Equipment, EquipmentCategory


class EquipmentSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=EquipmentCategory.objects.all(), source="category")

    class Meta:
        model = Equipment
        fields = ["id", "name", "category_id"]


class EquipmentCreateSerializer(EquipmentSerializer, OldPrimaryKeySerializer):
    category_pk = IntegerPrimaryKeyField(queryset=EquipmentCategory.objects.all(), source="category")

    class Meta(EquipmentSerializer.Meta):
        fields = [
            "pk",
            "category_pk",
        ] + get_all_translatable_fields(EquipmentSerializer.Meta.model)

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name_fi:
            raise GraphQLError("nameFi is required.")

        return data


class EquipmentUpdateSerializer(OldPrimaryKeyUpdateSerializer, EquipmentCreateSerializer):
    class Meta(EquipmentCreateSerializer.Meta):
        fields = EquipmentCreateSerializer.Meta.fields + ["pk"]
