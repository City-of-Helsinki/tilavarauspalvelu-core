from __future__ import annotations

from tilavarauspalvelu.models import EquipmentCategory

__all__ = [
    "EquipmentCategoryFilterSet",
]


class EquipmentCategoryFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = EquipmentCategory
