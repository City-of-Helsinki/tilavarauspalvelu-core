import datetime
from functools import partial
from typing import Any

from graphene_django_extensions.testing import build_mutation, build_query

from reservation_units.models import ReservationUnit

recurring_reservations_query = partial(build_query, "recurringReservations", connection=True, order_by="nameAsc")

CREATE_MUTATION = build_mutation("createRecurringReservation", "RecurringReservationCreateMutation")
UPDATE_MUTATION = build_mutation("updateRecurringReservation", "RecurringReservationUpdateMutation")


def get_minimal_create_date(reservation_unit: ReservationUnit) -> dict[str, Any]:
    return {
        "weekdays": [0],
        "beginDate": datetime.date(2023, 1, 1).isoformat(),
        "endDate": datetime.date(2023, 1, 2).isoformat(),
        "beginTime": datetime.time(10, 0, 0).isoformat(),
        "endTime": datetime.time(12, 0, 0).isoformat(),
        "recurrenceInDays": 7,
        "reservationUnit": reservation_unit.pk,
    }
