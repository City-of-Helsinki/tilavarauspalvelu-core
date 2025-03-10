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

    def delete_expired_statistics(self) -> None:
        """Deletes expired ReservationStatistics objects."""
        self.expired_statistics().delete()


class ReservationStatisticManager(models.Manager.from_queryset(ReservationStatisticQuerySet)): ...
