from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Equipment

from .filtersets import EquipmentAllFilterSet, EquipmentFilterSet
from .permissions import EquipmentAllPermission, EquipmentPermission


class EquipmentNode(DjangoNode):
    class Meta:
        model = Equipment
        fields = [
            "pk",
            "name",
            "category",
        ]
        filterset_class = EquipmentFilterSet
        permission_classes = [EquipmentPermission]


class EquipmentAllNode(DjangoNode):
    """This Node should be kept to the bare minimum and never expose any relations to avoid performance issues."""

    class Meta:
        model = Equipment
        fields = [
            "pk",
            "name",
        ]
        filterset_class = EquipmentAllFilterSet
        permission_classes = [EquipmentAllPermission]
        skip_registry = True
