from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode

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
