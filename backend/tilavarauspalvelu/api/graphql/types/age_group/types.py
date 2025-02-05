from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import AgeGroup

from .permissions import AgeGroupPermission

__all__ = [
    "AgeGroupNode",
]


class AgeGroupNode(DjangoNode):
    class Meta:
        model = AgeGroup
        fields = [
            "pk",
            "minimum",
            "maximum",
        ]
        permission_classes = [AgeGroupPermission]
