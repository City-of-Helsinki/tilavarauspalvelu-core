import datetime
from functools import partial
from typing import Any

from graphene_django_extensions.testing import build_mutation, build_query

from tests.factories import RecurringReservationFactory
from tilavarauspalvelu.enums import ReservationTypeChoice, WeekdayChoice
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    RecurringReservation,
    ReservationUnit,
    ReservationUnitHierarchy,
    User,
)
from utils.date_utils import local_date, local_time

recurring_reservations_query = partial(build_query, "recurringReservations", connection=True, order_by="nameAsc")

CREATE_SERIES_MUTATION = build_mutation("createReservationSeries", "ReservationSeriesCreateMutation")
UPDATE_SERIES_MUTATION = build_mutation("updateReservationSeries", "ReservationSeriesUpdateMutation")
RESCHEDULE_SERIES_MUTATION = build_mutation("rescheduleReservationSeries", "ReservationSeriesRescheduleMutation")
DENY_SERIES_MUTATION = build_mutation(
    "denyReservationSeries",
    "ReservationSeriesDenyMutation",
    fields="future denied",
)
CANCEL_SECTION_SERIES_MUTATION = build_mutation(
    "cancelAllApplicationSectionReservations",
    "ApplicationSectionReservationCancellationMutation",
    fields="future cancelled",
)


def get_minimal_series_data(reservation_unit: ReservationUnit, user: User, **overrides: Any) -> dict[str, Any]:
    return {
        "weekdays": [0],  # Mon
        "beginDate": datetime.date(2024, 1, 1).isoformat(),  # Mon
        "endDate": datetime.date(2024, 1, 2).isoformat(),  # Tue
        "beginTime": datetime.time(10, 0, 0).isoformat(),
        "endTime": datetime.time(12, 0, 0).isoformat(),
        "reservationUnit": reservation_unit.pk,
        "recurrenceInDays": 7,
        "reservationDetails": {
            "type": ReservationTypeChoice.STAFF.value,
            "user": user.pk,
        },
        **overrides,
    }


def get_minimal_reschedule_data(recurring_reservation: RecurringReservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": recurring_reservation.pk,
        **overrides,
    }


def create_reservation_series(**kwargs: Any) -> RecurringReservation:
    """
    Creates a series with 9 reservations:
    - 2023-12-04, 10:00-12:00, (Monday)
    - 2023-12-11, 10:00-12:00, (Monday)
    - 2023-12-18, 10:00-12:00, (Monday)
    - 2023-12-25, 10:00-12:00, (Monday)
    - 2024-01-01, 10:00-12:00, (Monday)
    - 2024-01-08, 10:00-12:00, (Monday)
    - 2024-01-15, 10:00-12:00, (Monday)
    - 2024-01-22, 10:00-12:00, (Monday)
    - 2024-01-29, 10:00-12:00, (Monday)
    """
    recurring_reservation = RecurringReservationFactory.create_with_matching_reservations(
        begin_date=local_date(year=2023, month=12, day=1),  # Friday
        begin_time=local_time(hour=10),
        end_date=local_date(year=2024, month=2, day=1),  # Thursday
        end_time=local_time(hour=12),
        weekdays=f"{WeekdayChoice.MONDAY}",
        **kwargs,
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    return recurring_reservation
