from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.units_api.serializers import UnitSerializer


class UnitUpdateSerializer(UnitSerializer, PrimaryKeyUpdateSerializer):
    class Meta(UnitSerializer.Meta):
        fields = UnitSerializer.Meta.fields + ["pk"]
