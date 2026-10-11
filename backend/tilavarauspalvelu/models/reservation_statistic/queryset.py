from __future__ import annotations

from typing import TYPE_CHECKING, Self

from dateutil.relativedelta import relativedelta
from django.conf import settings

from tilavarauspalvelu.models import ReservationStatistic
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    import datetime

__all__ = [
    "ReservationStatisticManager",
    "ReservationStatisticQuerySet",
    "statistics_retention_cutoff",
]


def statistics_retention_cutoff() -> datetime.datetime:
    """Statistics for reservations created at or before this moment are expired."""
    older_than_years = settings.REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS
    return local_datetime() - relativedelta(years=older_than_years)


class ReservationStatisticQuerySet(ModelQuerySet[ReservationStatistic]):
    def expired_statistics(self) -> Self:
        retention_cutoff = statistics_retention_cutoff()
        return self.filter(reservation_created_at__lte=retention_cutoff)


class ReservationStatisticManager(ModelManager[ReservationStatistic, ReservationStatisticQuerySet]):
    def delete_expired_statistics(self) -> None:
        self.all().expired_statistics().delete()
