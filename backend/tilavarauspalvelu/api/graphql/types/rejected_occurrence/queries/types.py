from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.models import RejectedOccurrence, User

from .filtersets import RejectedOccurrenceFilterSet
from .orderset import RejectedOccurrenceOrderSet


class RejectedOccurrenceNode(
    QueryType[RejectedOccurrence],
    filterset=RejectedOccurrenceFilterSet,
    orderset=RejectedOccurrenceOrderSet,
    interfaces=[Node],
):
    pk = Field()
    begin_datetime = Field()
    end_datetime = Field()
    rejection_reason = Field()
    created_at = Field()
    reservation_series = Field()

    @classmethod
    def __permissions__(cls, instance: RejectedOccurrence, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "No permission to access rejected occurrences"
            raise GraphQLPermissionError(msg)
