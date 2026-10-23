from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitPricingGroup

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.reservation_unit_pricing_group.queryset import ReservationUnitPricingGroupQuerySet
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ReservationUnitPricingGroupNode",
]


class ReservationUnitPricingGroupNode(DjangoNode):
    class Meta:
        model = ReservationUnitPricingGroup
        fields = [
            "pk",
            "reservation_unit",
            "pricing_group",
            "begins",
        ]

    @classmethod
    def filter_queryset(cls, queryset: ReservationUnitPricingGroupQuerySet, info: GQLInfo) -> models.QuerySet:
        return queryset.exclude_past()
