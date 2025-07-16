from __future__ import annotations

from tilavarauspalvelu.models import EquipmentCategory

__all__ = [
    "EquipmentCategorySerializer",
]


class EquipmentCategorySerializer(NestingModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = [
            "pk",
            "name",
        ]
