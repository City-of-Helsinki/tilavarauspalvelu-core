from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PriceOption
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "PriceOptionNode",
]


class PriceOptionNode(DjangoNode[PriceOption, AnyUser]):
    class Meta:
        model = PriceOption
        fields = [
            "pk",
            "name",
            "description",
            "is_active",
            "unit_group",
        ]
