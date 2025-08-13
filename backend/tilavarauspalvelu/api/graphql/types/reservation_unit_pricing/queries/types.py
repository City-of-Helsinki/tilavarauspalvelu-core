from decimal import Decimal

from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.models import ReservationUnitPricing, User
from tilavarauspalvelu.models.reservation_unit_pricing.queryset import ReservationUnitPricingQuerySet

__all__ = [
    "ReservationUnitPricingNode",
]


class ReservationUnitPricingNode(QueryType[ReservationUnitPricing], interfaces=[Node]):
    pk = Field()
    begins = Field()

    price_unit = Field()
    payment_type = Field()

    lowest_price = Field()
    highest_price = Field()

    tax_percentage = Field()

    @Field
    def lowest_price_net(root: ReservationUnitPricing, info: GQLInfo[User]) -> Decimal:
        return root.lowest_price_net

    @lowest_price_net.optimize
    def lowest_price_net_optimizer(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("lowest_price")
        tax_data = data.add_select_related("tax_percentage")
        tax_data.only_fields.add("value")

    @Field
    def highest_price_net(root: ReservationUnitPricing, info: GQLInfo[User]) -> Decimal:
        return root.highest_price_net

    @highest_price_net.optimize
    def highest_price_net_optimizer(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("highest_price")
        tax_data = data.add_select_related("tax_percentage")
        tax_data.only_fields.add("value")

    @classmethod
    def __filter_queryset__(
        cls,
        queryset: ReservationUnitPricingQuerySet,
        info: GQLInfo[User],
    ) -> ReservationUnitPricingQuerySet:
        return queryset.exclude_past()
