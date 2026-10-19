from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Sport
from tilavarauspalvelu.typing import AnyUser

from .filtersets import SportFilterSet
from .permissions import SportPermission

__all__ = [
    "SportNode",
]


class SportNode(DjangoNode[Sport, AnyUser]):
    class Meta:
        model = Sport
        fields = [
            "pk",
            "rank",
            "name",
        ]
        filterset_class = SportFilterSet
        permission_classes = [SportPermission]
