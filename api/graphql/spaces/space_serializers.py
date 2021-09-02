from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.space_api import SpaceSerializer
from spaces.models import Unit


class SpaceCreateSerializer(SpaceSerializer, PrimaryKeySerializer):
    max_persons = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False)
    terms_of_use = serializers.CharField(required=False, default="")
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source="unit", required=False, allow_null=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["district_id"].required = False
        self.fields["parent_id"].required = False
        self.fields.pop("building_id")

    class Meta(SpaceSerializer.Meta):
        fields = SpaceSerializer.Meta.fields + [
            "max_persons",
            "code",
            "terms_of_use",
            "unit_id",
        ]


class SpaceUpdateSerializer(PrimaryKeyUpdateSerializer, SpaceCreateSerializer):
    class Meta(SpaceCreateSerializer.Meta):
        fields = SpaceCreateSerializer.Meta.fields + ["pk"]
