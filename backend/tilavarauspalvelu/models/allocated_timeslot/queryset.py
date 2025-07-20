from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models

from tilavarauspalvelu.models import AllocatedTimeSlot, ReservationUnit
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import merge_time_slots

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.enums import Weekday
    from tilavarauspalvelu.models import ApplicationRound, ReservationUnitOption
    from utils.date_utils import TimeSlot


__all__ = [
    "AllocatedTimeSlotManager",
    "AllocatedTimeSlotQuerySet",
]


class AllocatedTimeSlotQuerySet(ModelQuerySet[AllocatedTimeSlot]):
    def has_overlapping_allocations(
        self,
        *,
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
        return (
            self.distinct()
            .alias(
                affected_reservation_unit_ids=models.Subquery(
                    queryset=ReservationUnit.objects.filter(id=reservation_unit).affected_reservation_unit_ids,
                ),
            )
            .filter(
                # Allocated to any reservation unit in the given one's "space hierarchy".
                reservation_unit_option__reservation_unit__id__in=models.F("affected_reservation_unit_ids"),
                # Allocation period overlaps with the given period.
                reservation_unit_option__application_section__reservations_begin_date__lte=end_date,
                reservation_unit_option__application_section__reservations_end_date__gte=begin_date,
            )
        )

    def for_application_round(self, ref: ApplicationRound | models.OuterRef) -> Self:
        return self.filter(reservation_unit_option__application_section__application__application_round=ref)


class AllocatedTimeSlotManager(ModelManager[AllocatedTimeSlot, AllocatedTimeSlotQuerySet]): ...
