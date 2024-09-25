from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import Purpose

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
