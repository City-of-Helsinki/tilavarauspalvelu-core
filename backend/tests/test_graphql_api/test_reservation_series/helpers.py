from __future__ import annotations

import datetime
import uuid
from functools import partial
from typing import TYPE_CHECKING, Any

from graphene_django_extensions.testing import build_mutation, build_query

from tilavarauspalvelu.enums import ReservationTypeChoice, Weekday
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesResponse,
)
from tilavarauspalvelu.models import ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, local_time

from tests.factories import ReservationSeriesFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationSeries, ReservationUnit, User

reservation_series_single_query = partial(build_query, "reservationSeries")
reservation_series_many_query = partial(build_query, "pagedReservationSeries", connection=True, order_by="nameAsc")

CREATE_SERIES_MUTATION = build_mutation("createReservationSeries", "ReservationSeriesCreateMutation")
UPDATE_SERIES_MUTATION = build_mutation("updateReservationSeries", "ReservationSeriesUpdateMutation")
ADD_RESERVATION_TO_SERIES_MUTATION = build_mutation("addReservationToSeries", "ReservationSeriesAddMutation")
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
CHANGE_ACCESS_CODE_SERIES_MUTATION = build_mutation(
    "changeReservationSeriesAccessCode",
    "ReservationSeriesChangeAccessCodeMutation",
    fields="accessCodeGeneratedAt accessCodeIsActive",
)
REPAIR_ACCESS_CODE_SERIES_MUTATION = build_mutation(
    "repairReservationSeriesAccessCode",
    "ReservationSeriesRepairAccessCodeMutation",
    fields="accessCodeGeneratedAt accessCodeIsActive",
)


def get_minimal_series_data(reservation_unit: ReservationUnit, user: User, **overrides: Any) -> dict[str, Any]:
    return {
        "weekdays": [Weekday.MONDAY.value],
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


def get_minimal_reschedule_data(reservation_series: ReservationSeries, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation_series.pk,
        **overrides,
    }


def get_minimal_add_data(reservation_series: ReservationSeries, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation_series.pk,
        "beginsAt": datetime.datetime(2024, 1, 2, 10, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "endsAt": datetime.datetime(2024, 1, 2, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        **overrides,
    }


def create_reservation_series(**kwargs: Any) -> ReservationSeries:
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
    reservation_series = ReservationSeriesFactory.create_with_matching_reservations(
        begin_date=local_date(year=2023, month=12, day=1),  # Friday
        begin_time=local_time(hour=10),
        end_date=local_date(year=2024, month=2, day=1),  # Thursday
        end_time=local_time(hour=12),
        weekdays=[Weekday.MONDAY.value],
        **kwargs,
    )

    ReservationUnitHierarchy.refresh()
    return reservation_series


def pindora_response() -> PindoraReservationSeriesResponse:
    return PindoraReservationSeriesResponse(
        reservation_unit_id=uuid.uuid4(),
        access_code="123456",
        access_code_keypad_url="https://example.com/keypad",
        access_code_phone_number="123456789",
        access_code_sms_number="123456789",
        access_code_sms_message="msg",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 10),
                end=local_datetime(2022, 1, 1, 12),
            )
        ],
    )
