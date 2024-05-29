from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from lookup_property import L

from common.date_utils import TimeSlot, merge_time_slots
from common.db import ArrayUnnest

if TYPE_CHECKING:
    import datetime

    from applications.choices import Weekday
    from applications.models import ReservationUnitOption


__all__ = [
    "AllocatedTimeSlotQuerySet",
]


class AllocatedTimeSlotQuerySet(models.QuerySet):
    def has_section_status_in(self, statuses: list[str]) -> Self:
        order = L("reservation_unit_option__application_section__status")
        return self.alias(application_section_status=order).filter(application_section_status__in=statuses)

    def order_by_allocated_time_of_week(self, *, desc: bool = False) -> Self:
        order = L("allocated_time_of_week")
        return self.alias(allocated_time_of_week=order).order_by(
            models.OrderBy(models.F("allocated_time_of_week"), descending=desc),
        )

    def order_by_application_status(self, *, desc: bool = False) -> Self:
        order = L("reservation_unit_option__application_section__application__status_sort_order")
        return self.alias(
            application_status_sort_order=order,
        ).order_by(
            models.OrderBy(models.F("application_status_sort_order"), descending=desc),
        )

    def order_by_application_section_status(self, *, desc: bool = False) -> Self:
        order = L("reservation_unit_option__application_section__status_sort_order")
        return self.alias(
            application_section_status_sort_order=order,
        ).order_by(
            models.OrderBy(models.F("application_section_status_sort_order"), descending=desc),
        )

    def order_by_applicant(self, *, desc: bool = False) -> Self:
        order = L("reservation_unit_option__application_section__application__applicant")
        return self.alias(applicant=order).order_by(models.OrderBy(models.F("applicant"), descending=desc))

    def order_by_day_of_the_week(self, *, desc: bool = False) -> Self:
        return self.alias(day_of_the_week_number=L("day_of_the_week_number")).order_by(
            models.OrderBy(models.F("day_of_the_week_number"), descending=desc)
        )

    def has_overlapping_allocations(
        self,
        reservation_unit_option: ReservationUnitOption,
        begin_date: datetime.date,
        end_date: datetime.date,
        day_of_the_week: Weekday,
        begin_time: datetime.time,
        end_time: datetime.time,
    ) -> bool:
        """Check existing allocations for overlapping time slots."""
        time_slots: list[TimeSlot] = list(
            self.filter(
                day_of_the_week=day_of_the_week,
                reservation_unit_option__application_section__reservations_begin_date__lt=end_date,
                reservation_unit_option__application_section__reservations_end_date__gt=begin_date,
                reservation_unit_option__reservation_unit__in=(
                    reservation_unit_option.reservation_unit.actions.reservation_units_with_common_hierarchy
                ),
            )
            .order_by("begin_time")
            .values("begin_time", "end_time")
        )
        merged = merge_time_slots(time_slots)

        # If the allocated period overlaps with any of the merged periods,
        # it cannot be allocated. Otherwise, it can be allocated.
        return any(slot["end_time"] > begin_time and slot["begin_time"] < end_time for slot in merged)

    def affecting_allocations(self, reservation_unit: int, begin_date: datetime.date, end_date: datetime.date) -> Self:
        from reservation_units.models import ReservationUnit

        return (
            self.distinct()
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
                # Allocated to any reservation unit in the given one's "space hierarchy".
                reservation_unit_option__reservation_unit__id__in=models.F("_affecting_ids"),
                # Allocation period overlaps with the given period.
                reservation_unit_option__application_section__reservations_begin_date__lte=end_date,
                reservation_unit_option__application_section__reservations_end_date__gte=begin_date,
            )
        )
