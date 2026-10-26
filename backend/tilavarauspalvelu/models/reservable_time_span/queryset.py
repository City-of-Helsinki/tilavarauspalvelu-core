from __future__ import annotations

from typing import TYPE_CHECKING, Self, TypeVar

from tilavarauspalvelu.models import ReservableTimeSpan
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import normalize_as_datetime

if TYPE_CHECKING:
    import datetime


__all__ = [
    "ReservableTimeSpanManager",
    "ReservableTimeSpanQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservableTimeSpan, covariant=True, default=ReservableTimeSpan)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservableTimeSpan)


class ReservableTimeSpanQuerySet(ModelQuerySet[_TModel_co, _TRow_co]):
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
        period_start = normalize_as_datetime(start)
        period_end = normalize_as_datetime(end, timedelta_days=1)
        return self.filter(start_datetime__lt=period_end, end_datetime__gt=period_start)

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
        period_start = normalize_as_datetime(start)
        period_end = normalize_as_datetime(end, timedelta_days=1)
        return self.filter(start_datetime__lte=period_start, end_datetime__gte=period_end)


class ReservableTimeSpanManager(ModelManager[ReservableTimeSpan, ReservableTimeSpanQuerySet]): ...
