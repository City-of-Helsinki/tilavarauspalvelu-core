from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.units_api.serializers import UnitSerializer


class UnitUpdateSerializer(UnitSerializer, PrimaryKeyUpdateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["tprek_id"].required = False
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["short_description"].required = False
        self.fields["web_page"].required = False
        self.fields["email"].required = False
        self.fields["phone"].required = False

    class Meta(UnitSerializer.Meta):
        fields = UnitSerializer.Meta.fields + ["pk"]
