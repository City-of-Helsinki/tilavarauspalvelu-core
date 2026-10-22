from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PricingGroup

from .permissions import PricingGroupPermission

__all__ = [
    "PricingGroupNode",
]


class PricingGroupNode(DjangoNode):
    class Meta:
        model = PricingGroup
        fields = [
            "pk",
            "name",
            "unit_group",
            "components",
            "reservation_units",
        ]
        permission_classes = [PricingGroupPermission]
