from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.space_api import SpaceSerializer


class SpaceCreateSerializer(SpaceSerializer, PrimaryKeySerializer):
    pass


class SpaceUpdateSerializer(SpaceSerializer, PrimaryKeyUpdateSerializer):
    class Meta(SpaceSerializer.Meta):
        fields = SpaceSerializer.Meta.fields + ["pk"]
