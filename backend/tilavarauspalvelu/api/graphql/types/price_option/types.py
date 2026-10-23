from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import PriceOption

__all__ = [
    "PriceOptionNode",
]


class PriceOptionNode(DjangoNode):
    class Meta:
        model = PriceOption
        fields = [
            "pk",
            "name",
            "description",
            "is_active",
            "unit_group",
        ]
