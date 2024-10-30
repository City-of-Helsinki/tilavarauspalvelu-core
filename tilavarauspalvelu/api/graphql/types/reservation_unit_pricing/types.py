import graphene
from django.db import models
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitPricing
from tilavarauspalvelu.models.reservation_unit_pricing.queryset import ReservationUnitPricingQuerySet
from tilavarauspalvelu.typing import GQLInfo


class ReservationUnitPricingNode(DjangoNode):
    lowest_price_net = graphene.Decimal()
    highest_price_net = graphene.Decimal()

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
