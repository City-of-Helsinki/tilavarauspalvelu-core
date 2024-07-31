from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from lookup_property import L

from common.date_utils import TimeSlot, merge_time_slots

if TYPE_CHECKING:
    import datetime

    from applications.enums import Weekday
    from applications.models import ApplicationSection


class SuitableTimeRangeQuerySet(models.QuerySet):
    def order_by_day_of_the_week(self, *, desc: bool = False) -> Self:
        return self.alias(day_of_the_week_number=L("day_of_the_week_number")).order_by(
            models.OrderBy(models.F("day_of_the_week_number"), descending=desc)
        )

    def fits_in_time_range(
        self,
        application_section: ApplicationSection,
        day_of_the_week: Weekday,
        begin_time: datetime.time,
        end_time: datetime.time,
    ) -> bool:
        time_ranges: list[TimeSlot] = list(
            self.filter(
                application_section=application_section,
                day_of_the_week=day_of_the_week,
            )
            .order_by("begin_time")
            .values("begin_time", "end_time")
        )
        merged = merge_time_slots(time_ranges)

        # If the given time slot fits fully in any of the existing merged time ranges,
        # it can be allocated. Otherwise, it cannot be allocated.
        return any(begin_time >= slot["begin_time"] and end_time <= slot["end_time"] for slot in merged)

    def fulfilled(self, value: bool) -> Self:
        return self.filter(L(fulfilled=value))
