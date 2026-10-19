from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PricingGroup
from tilavarauspalvelu.typing import AnyUser

from .permissions import PricingGroupPermission

__all__ = [
    "PricingGroupNode",
]


class PricingGroupNode(DjangoNode[PricingGroup, AnyUser]):
    class Meta:
        model = PricingGroup
        fields = [
            "pk",
            "name",
            "unit_group",
            "components",
            "reservation_unit_pricing_groups",
        ]
        permission_classes = [PricingGroupPermission]
