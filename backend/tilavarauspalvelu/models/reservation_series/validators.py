from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING

from django.conf import settings
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType
from utils.date_utils import local_date, local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import ReservationStartInterval
    from tilavarauspalvelu.models import Reservation, ReservationSeries

__all__ = [
    "ReservationSeriesValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationSeriesValidator:
    series: ReservationSeries

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

        if end_date > local_date() + datetime.timedelta(days=settings.HAUKI_DAYS_TO_FETCH):
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

    def validate_has_access_code_access_type(self) -> None:
        if AccessType.ACCESS_CODE not in self.series.used_access_types:
            msg = "Reservation series does not use access codes in any of its reservations."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_NOT_ACCESS_CODE)

    def validate_requires_active_access_code(self) -> None:
        if not self.series.should_have_active_access_code:
            msg = "Reservation series should not have active access code."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_SHOULD_NOT_HAVE_ACTIVE_ACCESS_CODE)

    def validate_series_has_ongoing_or_future_reservations(self) -> None:
        reservation: Reservation | None = self.series.reservations.last()
        if reservation is None:
            msg = "Reservation series has no reservations."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_NO_RESERVATION)

        if reservation.ends_at < local_datetime():
            msg = "Last reservation in the series has already ended."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_HAS_ENDED)

    @classmethod
    def validate_recurrence_in_days(cls, recurrence_in_days: int) -> None:
        if recurrence_in_days == 0 or recurrence_in_days % 7 != 0:
            msg = "Reoccurrence interval must be a multiple of 7 days."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS)
