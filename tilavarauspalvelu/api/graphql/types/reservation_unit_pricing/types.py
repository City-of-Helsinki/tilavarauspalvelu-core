import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitPricing


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
            "status",
        ]
