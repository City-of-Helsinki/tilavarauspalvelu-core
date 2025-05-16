from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode

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
