from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField

from tilavarauspalvelu.models import TaxLevel

from .filtersets import TaxLevelFilterSet
from .permissions import TaxLevelPermission

__all__ = [
    "TaxLevelNode",
]


class TaxLevelNode(DjangoNode):
    current_percentage = AnnotatedField(graphene.Decimal, expression=L("current_percentage"))

    class Meta:
        model = TaxLevel
        fields = [
            "pk",
            "name",
            "current_percentage",
        ]
        filterset_class = TaxLevelFilterSet
        permission_classes = [TaxLevelPermission]
