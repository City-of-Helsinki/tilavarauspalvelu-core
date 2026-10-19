from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PaymentProduct
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "PaymentProductNode",
]


class PaymentProductNode(DjangoNode[PaymentProduct, AnyUser]):
    pk = graphene.UUID(required=True)

    class Meta:
        model = PaymentProduct
        fields = [
            "pk",
            "merchant",
        ]
