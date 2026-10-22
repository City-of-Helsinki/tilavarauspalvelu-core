from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.models import PriceComponent

__all__ = [
    "PriceComponentNode",
]


class PriceComponentNode(DjangoNode):
    payment_type = graphene.Field(graphene.Enum.from_enum(PaymentType), required=False)

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
            "accounting",
            "can_apply_for_discount",
            "material_price_description",
            "payment_type",
        ]
