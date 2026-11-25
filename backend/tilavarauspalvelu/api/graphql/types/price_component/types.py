from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "PriceComponentNode",
]


class PriceComponentNode(DjangoNode[PriceComponent, AnyUser]):
    class Meta:
        model = PriceComponent
        fields = [
            "pk",
            "pricing_group",
            "kind",
            "valid_from",
            "valid_until",
            "price_option",
            "amount",
            "price_unit",
            "can_apply_for_discount",
            "is_adjustable",
            "material_price_description",
            "tax_level",
            "sales_item",
        ]
