from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import UnitGroup

from .permissions import UnitGroupPermission

__all__ = [
    "UnitGroupNode",
]


class UnitGroupNode(DjangoNode):
    class Meta:
        model = UnitGroup
        fields = [
            "pk",
            "name",
            "units",
        ]
        permission_classes = [UnitGroupPermission]
