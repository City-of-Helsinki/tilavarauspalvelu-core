from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes

if TYPE_CHECKING:
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
