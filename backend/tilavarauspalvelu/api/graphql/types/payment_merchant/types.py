from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PaymentMerchant
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "PaymentMerchantNode",
]


class PaymentMerchantNode(DjangoNode[PaymentMerchant, AnyUser]):
    pk = graphene.UUID(required=True)

    class Meta:
        model = PaymentMerchant
        fields = [
            "pk",
            "name",
        ]
