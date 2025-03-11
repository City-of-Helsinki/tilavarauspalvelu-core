from __future__ import annotations

from typing import Self

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime
from utils.db import NowTT

__all__ = [
    "RecurringReservationManager",
    "RecurringReservationQuerySet",
]


class RecurringReservationQuerySet(models.QuerySet):
    def old_empty_series(self) -> Self:
        older_than_days = settings.REMOVE_RECURRING_RESERVATIONS_OLDER_THAN_DAYS
        created_before = local_datetime() - relativedelta(days=older_than_days)
        return self.filter(created__lte=created_before, reservations__isnull=True)

    def delete_empty_series(self) -> None:
        self.old_empty_series().delete()

    def requiring_access_code(self) -> Self:
        """Return all recurring reservations that should have an access code but don't."""
        return self.alias(
            has_missing_access_codes=models.Exists(
                queryset=Reservation.objects.filter(
                    recurring_reservation=models.OuterRef("pk"),
                    state=ReservationStateChoice.CONFIRMED,
                    access_type=AccessType.ACCESS_CODE,
                    access_code_generated_at=None,
                    end__gt=NowTT(),
                ),
            )
        ).filter(has_missing_access_codes=True)


class RecurringReservationManager(models.Manager.from_queryset(RecurringReservationQuerySet)): ...
