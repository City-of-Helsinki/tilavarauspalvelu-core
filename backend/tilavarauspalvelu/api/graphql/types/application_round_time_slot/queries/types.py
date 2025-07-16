from __future__ import annotations

from typing import TYPE_CHECKING

from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import ApplicationRoundTimeSlot

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo, TimeSlot


__all__ = [
    "ApplicationRoundTimeSlotNode",
]


class ApplicationRoundTimeSlotNode(  # TODO: Add to reservation unit
    QueryType[ApplicationRoundTimeSlot],
    auto=False,
    interfaces=[Node],
):
    pk = Field()
    weekday = Field()
    is_closed = Field()

    reservation_unit = Field()

    @Field
    def reservable_times(root: ApplicationRoundTimeSlot, info: GQLInfo) -> list[TimeSlot]:
        return root.reservable_times  # type: ignore[return-value]
