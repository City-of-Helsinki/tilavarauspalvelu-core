from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.decimal_field import DecimalField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.translate_fields import get_all_translatable_fields
from api.space_api import SpaceSerializer
from spaces.models import Building, Space, Unit


class SpaceCreateSerializer(SpaceSerializer, PrimaryKeySerializer):
    parent_pk = IntegerPrimaryKeyField(
        queryset=Space.objects.all(),
        source="parent",
        help_text="PK of the parent space for this space.",
        allow_null=True,
    )
    building_pk = IntegerPrimaryKeyField(
        queryset=Building.objects.all(),
        source="building",
        help_text="PK of the building for this space.",
        allow_null=True,
    )

    max_persons = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False)
    unit_pk = IntegerPrimaryKeyField(
        queryset=Unit.objects.all(), source="unit", required=False, allow_null=True
    )
    surface_area = DecimalField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["parent_pk"].required = False
        self.fields.pop("building_pk")
        self.fields["name_fi"].required = True

    class Meta(SpaceSerializer.Meta):
        fields = [
            "pk",
            "parent_pk",
            "building_pk",
            "surface_area",
            "max_persons",
            "code",
            "unit_pk",
        ] + get_all_translatable_fields(Space)

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))

        if not name_fi or name_fi.isspace():
            raise serializers.ValidationError("nameFi cannot be empty.")

        return data


class SpaceUpdateSerializer(PrimaryKeyUpdateSerializer, SpaceCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["name_fi"].required = False

    class Meta(SpaceCreateSerializer.Meta):
        fields = SpaceCreateSerializer.Meta.fields + ["pk"]
