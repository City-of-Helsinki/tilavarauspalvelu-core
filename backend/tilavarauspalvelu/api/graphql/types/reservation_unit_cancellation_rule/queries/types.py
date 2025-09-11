from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
from tilavarauspalvelu.models import ReservationUnitCancellationRule, User

from .filtersets import ReservationUnitCancellationRuleFilterSet
from .orderset import ReservationUnitCancellationRuleOrderSet

__all__ = [
    "ReservationUnitCancellationRuleNode",
]


class ReservationUnitCancellationRuleNode(
    QueryType[ReservationUnitCancellationRule],
    filterset=ReservationUnitCancellationRuleFilterSet,
    orderset=ReservationUnitCancellationRuleOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    can_be_cancelled_time_before = Field()

    @classmethod
    def __permissions__(cls, instance: ReservationUnitCancellationRule, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "No permission to access reservation unit cancellation rule"
            raise GraphQLPermissionError(msg)
