from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.reservation_units_api import PurposeSerializer


class PurposeCreateSerializer(PurposeSerializer, PrimaryKeySerializer):
    pass


class PurposeUpdateSerializer(PurposeSerializer, PrimaryKeyUpdateSerializer):
    class Meta(PurposeSerializer.Meta):
        fields = PurposeSerializer.Meta.fields + ["pk"]
