from __future__ import annotations

import datetime
from functools import partial
from typing import TYPE_CHECKING, Any

from tilavarauspalvelu.enums import Weekday

from tests.query_builder import build_mutation, build_query

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitOption

allocations_query = partial(build_query, "allocatedTimeSlots", connection=True, orderBy="pkAsc")


CREATE_ALLOCATION = build_mutation(
    "createAllocatedTimeslot",
    "AllocatedTimeSlotCreateMutation",
)

DELETE_ALLOCATION = build_mutation(
    "deleteAllocatedTimeslot",
    "AllocatedTimeSlotDeleteMutation",
)


def allocation_create_data(
    option: ReservationUnitOption,
    *,
    day_of_the_week: Weekday = Weekday.MONDAY,
    begin_time: datetime.time = datetime.time(10),
    end_time: datetime.time = datetime.time(12),
    force: bool = False,
) -> dict[str, Any]:
    """Generate approve mutation input data for the given reservation unit option."""
    return {
        "dayOfTheWeek": day_of_the_week,
        "beginTime": begin_time.isoformat(),
        "endTime": end_time.isoformat(),
        "reservationUnitOption": option.pk,
        "force": force,
    }
