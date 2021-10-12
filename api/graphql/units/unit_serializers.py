from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.translate_fields import get_all_translatable_fields
from api.units_api.serializers import UnitSerializer


class UnitUpdateSerializer(UnitSerializer, PrimaryKeyUpdateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["tprek_id"].required = False
        self.fields["name_fi"].required = False
        self.fields["name_sv"].required = False
        self.fields["name_en"].required = False
        self.fields["description_fi"].required = False
        self.fields["description_sv"].required = False
        self.fields["description_en"].required = False
        self.fields["short_description_fi"].required = False
        self.fields["short_description_sv"].required = False
        self.fields["short_description_en"].required = False
        self.fields["web_page"].required = False
        self.fields["email"].required = False
        self.fields["phone"].required = False

    class Meta(UnitSerializer.Meta):
        fields = [
            "id",
            "pk",
            "tprek_id",
            "web_page",
            "email",
            "phone",
        ] + get_all_translatable_fields(UnitSerializer.Meta.model)
