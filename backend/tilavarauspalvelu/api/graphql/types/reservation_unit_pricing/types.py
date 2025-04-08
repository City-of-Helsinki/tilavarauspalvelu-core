from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitPricing

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.reservation_unit_pricing.queryset import ReservationUnitPricingQuerySet
    from tilavarauspalvelu.typing import GQLInfo


class ReservationUnitPricingNode(DjangoNode):
    lowest_price_net = graphene.Decimal(required=True)
    highest_price_net = graphene.Decimal(required=True)

    class Meta:
        model = ReservationUnitPricing
        fields = [
            "pk",
            "begins",
            "price_unit",
            "lowest_price",
            "lowest_price_net",
            "highest_price",
            "highest_price_net",
            "tax_percentage",
        ]

    @classmethod
    def filter_queryset(cls, queryset: ReservationUnitPricingQuerySet, info: GQLInfo) -> models.QuerySet:
        return queryset.exclude_past()
