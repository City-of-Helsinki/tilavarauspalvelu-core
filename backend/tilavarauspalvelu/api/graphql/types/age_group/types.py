from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import AgeGroup
from tilavarauspalvelu.typing import AnyUser

from .permissions import AgeGroupPermission

__all__ = [
    "AgeGroupNode",
]


class AgeGroupNode(DjangoNode[AgeGroup, AnyUser]):
    class Meta:
        model = AgeGroup
        fields = [
            "pk",
            "minimum",
            "maximum",
        ]
        permission_classes = [AgeGroupPermission]
