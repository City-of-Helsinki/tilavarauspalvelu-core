from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import Equipment

__all__ = [
    "EquipmentSerializer",
]


class EquipmentSerializer(NestingModelSerializer[Equipment]):
    class Meta:
        model = Equipment
        fields = [
            "pk",
            "name",
            "category",
        ]
