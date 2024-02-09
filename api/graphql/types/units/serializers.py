from api.graphql.extensions.legacy_helpers import OldPrimaryKeyUpdateSerializer, get_all_translatable_fields
from api.legacy_rest_api.base_serializers import OldTranslatedModelSerializer
from spaces.models import Unit


class UnitSerializer(OldTranslatedModelSerializer):
    class Meta:
        model = Unit
        fields = [
            "id",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the unit.",
            },
        }


class UnitUpdateSerializer(UnitSerializer, OldPrimaryKeyUpdateSerializer):
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
            "pk",
            "tprek_id",
            "web_page",
            "email",
            "phone",
            *get_all_translatable_fields(UnitSerializer.Meta.model),
        ]
