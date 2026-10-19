from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import IntendedUse

__all__ = [
    "IntendedUseSerializer",
]


class IntendedUseSerializer(NestingModelSerializer[IntendedUse]):
    class Meta:
        model = IntendedUse
        fields = [
            "pk",
            "name",
        ]
