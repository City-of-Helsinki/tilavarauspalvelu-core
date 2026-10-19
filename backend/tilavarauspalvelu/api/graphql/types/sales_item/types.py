from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import SalesItem
from tilavarauspalvelu.typing import AnyUser

from .filtersets import SalesItemFilterSet
from .permissions import SalesItemPermission

__all__ = [
    "SalesItemNode",
]


class SalesItemNode(DjangoNode[SalesItem, AnyUser]):
    class Meta:
        model = SalesItem
        fields = [
            "pk",
            "name",
            "tax_level",
        ]
        filterset_class = SalesItemFilterSet
        permission_classes = [SalesItemPermission]
