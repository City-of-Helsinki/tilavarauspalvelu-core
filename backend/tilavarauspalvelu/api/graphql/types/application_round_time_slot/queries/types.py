from undine import Field, GQLInfo, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import ApplicationRoundTimeSlot, User
from tilavarauspalvelu.typing import TimeSlot

__all__ = [
    "ApplicationRoundTimeSlotNode",
]


class ApplicationRoundTimeSlotNode(QueryType[ApplicationRoundTimeSlot], interfaces=[Node]):
    pk = Field()
    weekday = Field()
    is_closed = Field()

    @Field
    def reservable_times(root: ApplicationRoundTimeSlot, info: GQLInfo[User]) -> list[TimeSlot]:
        return root.reservable_times  # type: ignore[return-value]
