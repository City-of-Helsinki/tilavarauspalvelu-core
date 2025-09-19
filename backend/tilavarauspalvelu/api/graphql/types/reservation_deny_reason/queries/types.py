from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
from tilavarauspalvelu.models import ReservationDenyReason, User

from .filtersets import ReservationDenyReasonFilterSet
from .orderset import ReservationDenyReasonOrderSet

__all__ = [
    "ReservationDenyReasonNode",
]


class ReservationDenyReasonNode(
    QueryType[ReservationDenyReason],
    filterset=ReservationDenyReasonFilterSet,
    orderset=ReservationDenyReasonOrderSet,
    interfaces=[Node],
):
    pk = Field()

    reason = Field(TranslatedField)
    reason_fi = Field(deprecation_reason="Use 'reason' instead.")
    reason_sv = Field(deprecation_reason="Use 'reason' instead.")
    reason_en = Field(deprecation_reason="Use 'reason' instead.")

    @classmethod
    def __permissions__(cls, instance: ReservationDenyReason, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "No permission to access reservation deny reason."
            raise GraphQLPermissionError(msg)
