from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.models import PaymentMerchant, Unit, User

from .filtersets import UnitFilterSet
from .ordersets import UnitOrderSet

__all__ = [
    "UnitNode",
]


class UnitNode(
    QueryType[Unit],
    filterset=UnitFilterSet,
    orderset=UnitOrderSet,
    interfaces=[Node],
):
    pk = Field()
    tprek_id = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    description_fi = Field()
    description_sv = Field()
    description_en = Field()

    short_description_fi = Field()
    short_description_sv = Field()
    short_description_en = Field()

    web_page = Field()
    email = Field()
    phone = Field()

    address_street_fi = Field()
    address_street_sv = Field()
    address_street_en = Field()

    address_zip = Field()

    address_city_fi = Field()
    address_city_sv = Field()
    address_city_en = Field()

    reservation_units = Field()
    spaces = Field()
    unit_groups = Field()
    payment_merchant = Field()

    @payment_merchant.resolve
    def resolve_payment_merchant(root: Unit, info: GQLInfo[User]) -> PaymentMerchant | None:
        user = info.context.user
        if not user.permissions.can_manage_unit(root):
            return None
        return root.payment_merchant

    @payment_merchant.optimize
    def optimize_payment_merchant(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.add_prefetch_related("unit_groups")


class UnitAllNode(
    QueryType[Unit],
    filterset=UnitFilterSet,
    orderset=UnitOrderSet,
    interfaces=[Node],
    register=False,
):
    """This Node should be kept to the bare minimum and never expose any relations to avoid performance issues."""

    pk = Field()
    tprek_id = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()
