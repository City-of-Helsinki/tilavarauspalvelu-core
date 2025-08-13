from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.models import SuitableTimeRange, User

from .filtersets import SuitableTimeRangeFilterSet
from .ordersets import SuitableTimeRangeOrderSet

__all__ = [
    "SuitableTimeRangeNode",
]


class SuitableTimeRangeNode(
    QueryType[SuitableTimeRange],
    filterset=SuitableTimeRangeFilterSet,
    orderset=SuitableTimeRangeOrderSet,
    interfaces=[Node],
):
    pk = Field()
    priority = Field()
    day_of_the_week = Field()
    begin_time = Field()
    end_time = Field()
    application_section = Field()

    fulfilled = Field(L("fulfilled"))

    @classmethod
    def __permissions__(cls, instance: SuitableTimeRange, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "No permission to access reservation related data"
            raise GraphQLPermissionError(msg)
