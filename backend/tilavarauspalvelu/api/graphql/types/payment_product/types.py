from __future__ import annotations

from tilavarauspalvelu.models import PaymentProduct

__all__ = [
    "PaymentProductNode",
]


class PaymentProductNode(DjangoNode):
    pk = graphene.UUID(required=True)

    class Meta:
        model = PaymentProduct
        fields = [
            "pk",
            "merchant",
        ]
