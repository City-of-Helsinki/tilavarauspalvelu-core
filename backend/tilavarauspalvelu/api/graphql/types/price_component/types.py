from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PriceComponent

__all__ = [
    "PriceComponentNode",
]


class PriceComponentNode(DjangoNode):
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
            "material_price_description",
            "tax_level",
            "sales_item",
        ]
