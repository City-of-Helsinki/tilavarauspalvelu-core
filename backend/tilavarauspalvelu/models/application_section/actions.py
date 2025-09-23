from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.models import Reservation, ReservationSeries

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
    from tilavarauspalvelu.models.reservation_series.queryset import ReservationSeriesQuerySet


__all__ = [
    "ApplicationSectionActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationSectionActions:
    application_section: ApplicationSection

    def get_reservation_series(self) -> ReservationSeriesQuerySet:
        return (
            ReservationSeries.objects.filter(
                allocated_time_slot__reservation_unit_option__application_section=self.application_section
            )
            .prefetch_related("reservations")
            .order_by("begin_date")
        )

    def get_reservations(self) -> ReservationQuerySet:
        return Reservation.objects.for_application_section(self.application_section)

    def get_last_reservation(self) -> Reservation | None:
        return self.get_reservations().last()
