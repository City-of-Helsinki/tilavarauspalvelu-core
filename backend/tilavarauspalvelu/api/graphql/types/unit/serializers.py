from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import Unit

__all__ = [
    "UnitUpdateSerializer",
]


class UnitUpdateSerializer(NestingModelSerializer):
    class Meta:
        model = Unit
        fields = [
            "pk",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
        ]
