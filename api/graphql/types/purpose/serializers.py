from graphene_django_extensions import NestingModelSerializer

from reservation_units.models import Purpose

__all__ = [
    "PurposeSerializer",
]


class PurposeSerializer(NestingModelSerializer):
    class Meta:
        model = Purpose
        fields = [
            "pk",
            "name",
        ]
