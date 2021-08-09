from api.base import TranslatedModelSerializer
from spaces.models import Unit


class UnitSerializer(TranslatedModelSerializer):
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
