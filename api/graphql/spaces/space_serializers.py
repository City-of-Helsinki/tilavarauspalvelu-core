from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.translate_fields import get_all_translatable_fields
from api.space_api import SpaceSerializer
from spaces.models import Space, Unit


class SpaceCreateSerializer(SpaceSerializer, PrimaryKeySerializer):
    max_persons = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False)
    terms_of_use_fi = serializers.CharField(required=False, default="")
    terms_of_use_sv = serializers.CharField(required=False, default="")
    terms_of_use_en = serializers.CharField(required=False, default="")
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source="unit", required=False, allow_null=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["district_id"].required = False
        self.fields["parent_id"].required = False
        self.fields.pop("building_id")
        self.fields["name_fi"].required = True

    class Meta(SpaceSerializer.Meta):
        fields = [
            "id",
            "parent_id",
            "building_id",
            "surface_area",
            "district_id",
            "max_persons",
            "code",
            "unit_id",
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
