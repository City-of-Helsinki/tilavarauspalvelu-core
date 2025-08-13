from undine import Filter, FilterSet

from tilavarauspalvelu.models import EquipmentCategory

__all__ = [
    "EquipmentCategoryFilterSet",
]


class EquipmentCategoryFilterSet(FilterSet[EquipmentCategory]):
    pk = Filter(lookup="in")
