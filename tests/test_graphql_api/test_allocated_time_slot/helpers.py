import datetime
from functools import partial
from typing import Any

from graphene_django_extensions.testing import build_mutation, build_query

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import ReservationUnitOption

allocations_query = partial(build_query, "allocatedTimeSlots", connection=True, order_by="pkAsc")


CREATE_ALLOCATION = build_mutation(
    "createAllocatedTimeslot",
    "AllocatedTimeSlotCreateMutation",
)

DELETE_ALLOCATION = build_mutation(
    "deleteAllocatedTimeslot",
    "AllocatedTimeSlotDeleteMutation",
    fields="deleted",
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
