import datetime
from typing import Self

from django.db import models

from common.date_utils import normalize_as_datetime

__all__ = [
    "ReservableTimeSpanManager",
    "ReservableTimeSpanQuerySet",
]


class ReservableTimeSpanQuerySet(models.QuerySet):
    def overlapping_with_period(
        self,
        start: datetime.datetime | datetime.date,
        end: datetime.datetime | datetime.date,
    ) -> Self:
        """
        Filter to reservable time spans that overlap with the given period.

             ┌─ Period ─┐
        ---  │          │      # No
        -----│          │      # No
        -----│--        │      # Yes
        -----│----------│      # Yes
             │          │
             │  ------  │      # Yes
             │----------│      # Yes
        -----│----------│----- # Yes
             │          │
             │----------│----- # Yes
             │        --│----- # Yes
             │          │----- # No
             │          │  --- # No
        """
        start: datetime = normalize_as_datetime(start)
        end: datetime = normalize_as_datetime(end, timedelta_days=1)
        return self.filter(start_datetime__lt=end, end_datetime__gt=start)

    def fully_fill_period(
        self,
        start: datetime.datetime | datetime.date,
        end: datetime.datetime | datetime.date,
    ) -> Self:
        """
        Filter to reservable time spans that can fully fill in the given period.

             ┌─ Period ─┐
        ---  │          │      # No
        -----│          │      # No
        -----│--        │      # No
        -----│----------│      # Yes
             │          │
             │  ------  │      # No
             │----------│      # Yes
        -----│----------│----- # Yes
             │          │
             │----------│----- # Yes
             │        --│----- # No
             │          │----- # No
             │          │  --- # No
        """
        start: datetime = normalize_as_datetime(start)
        end: datetime = normalize_as_datetime(end, timedelta_days=1)
        return self.filter(start_datetime__lte=start, end_datetime__gte=end)

    def truncated_start_and_end_datetimes_for_period(
        self,
        start: datetime.datetime | datetime.date,
        end: datetime.datetime | datetime.date,
    ) -> Self:
        """
        Annotate truncated start and end datetimes for reservable time spans that overlap with the given period.

        If the time span starts before the period, the start time is set to the period start.
        If the time span ends after the period, the end time is set to the period end (start of next day).
        """
        start = normalize_as_datetime(start)
        end = normalize_as_datetime(end, timedelta_days=1)
        return self.overlapping_with_period(
            start=start,
            end=end,
        ).annotate(
            truncated_start_datetime=models.Case(
                models.When(
                    condition=models.Q(start_datetime__lt=start),
                    then=models.Value(start),
                ),
                default="start_datetime",
            ),
            truncated_end_datetime=models.Case(
                models.When(
                    condition=models.Q(end_datetime__gt=end),
                    then=models.Value(end),
                ),
                default="end_datetime",
            ),
        )


class ReservableTimeSpanManager(models.Manager.from_queryset(ReservableTimeSpanQuerySet)): ...
