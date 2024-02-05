import datetime
from functools import partial
from typing import Any

from reservation_units.models import ReservationUnit
from tests.gql_builders import build_mutation, build_query

recurring_reservations_query = partial(build_query, "recurringReservations", connection=True, order_by="name")

CREATE_MUTATION = build_mutation(
    "createRecurringReservation",
    "RecurringReservationCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateRecurringReservation",
    "RecurringReservationUpdateMutationInput",
)


def get_minimal_create_date(reservation_unit: ReservationUnit) -> dict[str, Any]:
    return {
        "weekdays": [0],
        "beginDate": datetime.date(2023, 1, 1).isoformat(),
        "endDate": datetime.date(2023, 1, 2).isoformat(),
        "beginTime": datetime.time(10, 0, 0).isoformat(),
        "endTime": datetime.time(12, 0, 0).isoformat(),
        "recurrenceInDays": 7,
        "reservationUnitPk": reservation_unit.pk,
    }
