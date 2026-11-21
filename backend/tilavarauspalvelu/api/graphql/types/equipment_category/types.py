from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import EquipmentCategory
from tilavarauspalvelu.typing import AnyUser

from .filtersets import EquipmentCategoryFilterSet
from .permissions import EquipmentCategoryPermission

__all__ = [
    "EquipmentCategoryNode",
]


class EquipmentCategoryNode(DjangoNode[EquipmentCategory, AnyUser]):
    class Meta:
        model = EquipmentCategory
        fields = [
            "pk",
            "name",
        ]
        permission_classes = [EquipmentCategoryPermission]
        filterset_class = EquipmentCategoryFilterSet
