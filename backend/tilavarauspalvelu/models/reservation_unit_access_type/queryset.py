from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from lookup_property import L

from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime


__all__ = [
    "ReservationUnitAccessTypeManager",
    "ReservationUnitAccessTypeQuerySet",
]


class ReservationUnitAccessTypeQuerySet(models.QuerySet):
    def active(self, *, on_date: datetime.date | None = None) -> Self:
        """Get only the active access types for each reservation unit."""
        on_date = on_date or local_date()
        return self.filter(models.Q(begin_date__lte=on_date) & L(end_date__gt=on_date))

    def on_period(self, begin_date: datetime.date, end_date: datetime.date) -> Self:
        """Get only the access types that are active during the given period."""
        return self.filter(models.Q(begin_date__lte=end_date) & L(end_date__gt=begin_date))

    def active_or_future(self, *, on_date: datetime.date | None = None) -> Self:
        """Get only the active or future access types."""
        on_date = on_date or local_date()
        return self.filter(L(end_date__gt=on_date))


class ReservationUnitAccessTypeManager(models.Manager.from_queryset(ReservationUnitAccessTypeQuerySet)): ...
