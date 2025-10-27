from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.models import ReservationUnitPricing

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.reservation_unit_pricing.queryset import ReservationUnitPricingQuerySet
    from tilavarauspalvelu.typing import GQLInfo


class ReservationUnitPricingNode(DjangoNode):
    payment_type = graphene.Field(graphene.Enum.from_enum(PaymentType), required=False)
    lowest_price_net = graphene.Decimal(required=True)
    highest_price_net = graphene.Decimal(required=True)

    class Meta:
        model = ReservationUnitPricing
        fields = [
            "pk",
            "begins",
            "is_activated_on_begins",
            "price_unit",
            "payment_type",
            "lowest_price",
            "lowest_price_net",
            "highest_price",
            "highest_price_net",
            "tax_percentage",
            "material_price_description_fi",
            "material_price_description_en",
            "material_price_description_sv",
        ]

    @classmethod
    def filter_queryset(cls, queryset: ReservationUnitPricingQuerySet, info: GQLInfo) -> models.QuerySet:
        return queryset.exclude_past()
