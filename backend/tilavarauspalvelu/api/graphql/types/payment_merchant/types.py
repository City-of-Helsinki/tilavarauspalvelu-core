from __future__ import annotations

from tilavarauspalvelu.models import PaymentMerchant

__all__ = [
    "PaymentMerchantNode",
]


class PaymentMerchantNode(DjangoNode):
    pk = graphene.UUID(required=True)

    class Meta:
        model = PaymentMerchant
        fields = [
            "pk",
            "name",
        ]
