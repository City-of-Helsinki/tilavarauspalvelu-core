from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.space_api import SpaceSerializer


class SpaceCreateSerializer(SpaceSerializer, PrimaryKeySerializer):
    max_persons = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False)
    terms_of_use = serializers.CharField(required=False, default="")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["building_id"].required = False
        self.fields["district_id"].required = False
        self.fields["parent_id"].required = False

    class Meta(SpaceSerializer.Meta):
        fields = SpaceSerializer.Meta.fields + ["max_persons", "code", "terms_of_use"]


class SpaceUpdateSerializer(PrimaryKeyUpdateSerializer, SpaceCreateSerializer):
    class Meta(SpaceCreateSerializer.Meta):
        fields = SpaceCreateSerializer.Meta.fields + ["pk"]
