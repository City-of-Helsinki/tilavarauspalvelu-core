import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from reservation_units.models import ReservationUnitPricing


class ReservationUnitPricingType(AuthNode, OldPrimaryKeyObjectType):
    lowest_price_net = graphene.Decimal()
    highest_price_net = graphene.Decimal()

    class Meta:
        model = ReservationUnitPricing
        fields = [
            "pk",
            "begins",
            "pricing_type",
            "price_unit",
            "lowest_price",
            "lowest_price_net",
            "highest_price",
            "highest_price_net",
            "tax_percentage",
            "status",
        ]
