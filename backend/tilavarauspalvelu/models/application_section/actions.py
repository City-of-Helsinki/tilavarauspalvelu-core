from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.db import models

from tilavarauspalvelu.models import Reservation, ReservationSeries, ReservationUnit

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
    from tilavarauspalvelu.models.reservation_series.queryset import ReservationSeriesQuerySet
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet


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

    def get_reservation_units(self) -> ReservationUnitQuerySet:
        return ReservationUnit.objects.filter(
            pk__in=models.Subquery(
                queryset=(
                    ReservationSeries.objects.all()
                    .filter(allocated_time_slot__reservation_unit_option__application_section=self.application_section)
                    .values("reservation_unit_id")
                ),
            ),
        )

    def get_last_reservation(self) -> Reservation | None:
        return self.get_reservations().last()
