from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.integrations.opening_hours.reservable_time_span_client import ReservableTimeSpanClient
from utils.date_utils import local_date

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import ReservationStartInterval
    from tilavarauspalvelu.models import RecurringReservation

__all__ = [
    "ReservationSeriesValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationSeriesValidator:
    series: RecurringReservation

    def validate_has_reservations(self) -> None:
        if not self.series.reservations.exists():
            msg = "Reservation series must have at least one reservation"
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_NO_RESERVATION)

    @classmethod
    def validate_series_time_slots(
        cls,
        begin_date: datetime.date,
        begin_time: datetime.time,
        end_date: datetime.date,
        end_time: datetime.time,
        reservation_start_interval: ReservationStartInterval,
    ) -> None:
        if end_date < begin_date:
            msg = "Begin date cannot be after end date."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_DATE_AFTER_END_DATE)

        if end_date > local_date() + datetime.timedelta(days=ReservableTimeSpanClient.DAYS_TO_FETCH):
            msg = "Cannot create reservations for more than 2 years in the future."
            raise ValidationError(msg, code=error_codes.RESERVATION_END_DATE_TOO_FAR)

        if begin_date == end_date and end_time <= begin_time:
            msg = "Begin time cannot be after end time if on the same day."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_TIME_AFTER_END_TIME)

        # Staff reservations ignore start intervals longer than 30 minutes
        interval_minutes = min(reservation_start_interval.as_number, 30)

        # For staff reservations, we don't need to care about opening hours,
        # so we can just check start interval from the beginning of the day.
        is_valid_start_interval = (
            begin_time.second == 0  #
            and begin_time.microsecond == 0
            and begin_time.minute % interval_minutes == 0
        )

        if not is_valid_start_interval:
            msg = f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
            raise ValidationError(msg, code=error_codes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL)
