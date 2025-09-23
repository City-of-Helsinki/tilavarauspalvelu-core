from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    description = Field(TranslatedField)
    description_fi = Field(deprecation_reason="Use 'description' instead.")
    description_sv = Field(deprecation_reason="Use 'description' instead.")
    description_en = Field(deprecation_reason="Use 'description' instead.")

    short_description = Field(TranslatedField)
    short_description_fi = Field(deprecation_reason="Use 'short_description' instead.")
    short_description_sv = Field(deprecation_reason="Use 'short_description' instead.")
    short_description_en = Field(deprecation_reason="Use 'short_description' instead.")

    web_page = Field()
    email = Field()
    phone = Field()

    address_street = Field(TranslatedField)
    address_street_fi = Field(deprecation_reason="Use 'address_street' instead.")
    address_street_sv = Field(deprecation_reason="Use 'address_street' instead.")
    address_street_en = Field(deprecation_reason="Use 'address_street' instead.")

    address_zip = Field()

    address_city = Field(TranslatedField)
    address_city_fi = Field(deprecation_reason="Use 'address_city' instead.")
    address_city_sv = Field(deprecation_reason="Use 'address_city' instead.")
    address_city_en = Field(deprecation_reason="Use 'address_city' instead.")

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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")
