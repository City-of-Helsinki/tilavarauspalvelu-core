from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

from common.db import ArrayUnnest

if TYPE_CHECKING:
    from applications.models import ApplicationSection
    from applications.querysets.allocated_time_slot import AllocatedTimeSlotQuerySet


class ApplicationSectionActions:
    def __init__(self, application_section: ApplicationSection) -> None:
        self.application_section = application_section

    def affecting_allocations(self, reservation_unit: int) -> AllocatedTimeSlotQuerySet:
        from applications.models import AllocatedTimeSlot
        from reservation_units.models import ReservationUnit

        return (
            AllocatedTimeSlot.objects.distinct()
            .alias(
                _affecting_ids=models.Subquery(
                    queryset=(
                        ReservationUnit.objects.filter(id=reservation_unit)
                        .with_reservation_unit_ids_affecting_reservations()
                        .annotate(_found_ids=ArrayUnnest("reservation_units_affecting_reservations"))
                        .values("_found_ids")
                    )
                )
            )
            .filter(
                # Don't include this section's allocations
                ~models.Q(reservation_unit_option__application_section=self.application_section.id),
                # Allocated to any reservation unit affecting this allocation's reservation unit
                reservation_unit_option__reservation_unit__id__in=models.F("_affecting_ids"),
                # Allocation period overlaps with this section's period
                reservation_unit_option__application_section__reservations_begin_date__lte=(
                    self.application_section.reservations_end_date
                ),
                reservation_unit_option__application_section__reservations_end_date__gte=(
                    self.application_section.reservations_begin_date
                ),
            )
        )
