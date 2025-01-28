from __future__ import annotations

from typing import Self

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models

from utils.date_utils import local_datetime

__all__ = [
    "RecurringReservationManager",
    "RecurringReservationQuerySet",
]


class RecurringReservationQuerySet(models.QuerySet):
    def old_empty_series(self) -> Self:
        older_than_days = settings.REMOVE_RECURRING_RESERVATIONS_OLDER_THAN_DAYS
        created_before = local_datetime() - relativedelta(days=older_than_days)
        return self.filter(created__lte=created_before, reservations__isnull=True)


class RecurringReservationManager(models.Manager.from_queryset(RecurringReservationQuerySet)): ...
