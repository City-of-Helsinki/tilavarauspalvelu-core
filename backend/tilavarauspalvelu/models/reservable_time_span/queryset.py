from __future__ import annotations

from typing import TYPE_CHECKING, Self

from tilavarauspalvelu.models import ReservableTimeSpan
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import normalize_as_datetime

if TYPE_CHECKING:
    import datetime


__all__ = [
    "ReservableTimeSpanManager",
    "ReservableTimeSpanQuerySet",
]


class ReservableTimeSpanQuerySet(ModelQuerySet[ReservableTimeSpan]):
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


class ReservableTimeSpanManager(ModelManager[ReservableTimeSpan, ReservableTimeSpanQuerySet]): ...
