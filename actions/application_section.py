from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

from common.db import ArrayUnnest

if TYPE_CHECKING:
    from applications.models import ApplicationSection
    from applications.querysets.application_section import ApplicationSectionQuerySet


class ApplicationSectionActions:
    def __init__(self, application_section: ApplicationSection) -> None:
        self.application_section = application_section

    def application_sections_affecting_allocations(self) -> ApplicationSectionQuerySet:
        from applications.models import ApplicationSection
        from reservation_units.models import ReservationUnit

        return (
            ApplicationSection.objects.distinct()
            .alias(
                _affecting_ids=models.Subquery(
                    queryset=(
                        ReservationUnit.objects.alias(
                            # All reservation units that are possible for this section
                            _reservation_unit_ids=models.Subquery(
                                self.application_section.reservation_unit_options.values("reservation_unit__id"),
                            ),
                        )
                        .filter(id__in=models.F("_reservation_unit_ids"))
                        .with_reservation_unit_ids_affecting_reservations()
                        .annotate(_found_ids=ArrayUnnest("reservation_units_affecting_reservations"))
                        .values("_found_ids")
                    )
                )
            )
            .filter(
                # Don't include this event.
                ~models.Q(id=self.application_section.id),
                # Application section has allocations.
                reservation_unit_options__isnull=False,
                reservation_unit_options__allocated_time_slots__isnull=False,
                # Allocated to any reservation unit affecting this section's allocations.
                reservation_unit_options__reservation_unit__id__in=models.F("_affecting_ids"),
                # Allocation period overlaps with this section's period.
                reservations_begin_date__lte=self.application_section.reservations_end_date,
                reservations_end_date__gte=self.application_section.reservations_begin_date,
            )
        )
