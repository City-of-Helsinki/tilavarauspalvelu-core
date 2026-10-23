from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationPriceLine

__all__ = [
    "ReservationPriceLineNode",
]


class ReservationPriceLineNode(DjangoNode):
    class Meta:
        model = ReservationPriceLine
        fields = [
            "pk",
            "description",
            "quantity",
            "price_unit",
            "unit_amount",
            "amount_before_adjustment",
            "adjustment_percentage",
            "amount",
            "override_amount",
            "tax_percentage",
        ]
