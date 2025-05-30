from __future__ import annotations

from typing import Self

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models

from utils.date_utils import local_datetime

__all__ = [
    "ReservationStatisticManager",
    "ReservationStatisticQuerySet",
]


class ReservationStatisticQuerySet(models.QuerySet):
    def expired_statistics(self) -> Self:
        older_than_years = settings.REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS
        remove_older_than = local_datetime() - relativedelta(years=older_than_years)
        return self.filter(reservation_created_at__lte=remove_older_than)


# Need to do this to get proper type hints in the manager methods, since
# 'from_queryset' returns a subclass of Manager, but is not typed correctly...
_BaseManager: type[models.Manager] = models.Manager.from_queryset(ReservationStatisticQuerySet)  # type: ignore[assignment]


class ReservationStatisticManager(_BaseManager):
    # Define to get type hints for queryset methods.
    def all(self) -> ReservationStatisticQuerySet:
        return super().all()  # type: ignore[return-value]

    def delete_expired_statistics(self) -> None:
        self.all().expired_statistics().delete()
