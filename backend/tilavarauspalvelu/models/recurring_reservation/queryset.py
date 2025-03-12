from __future__ import annotations

from typing import TYPE_CHECKING, Self

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime
from utils.db import NowTT

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound

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

    def should_have_active_access_code(self) -> Self:
        """Return all recurring reservations should have an active access code."""
        return self.filter(L(should_have_active_access_code=True))

    def has_incorrect_access_code_is_active(self) -> Self:
        """
        Return all recurring reservations where the access code is active
        when it should be inactive, or vice versa.
        """
        return self.alias(
            has_incorrect_access_codes=models.Exists(
                queryset=Reservation.objects.filter(
                    (
                        (models.Q(access_code_is_active=True) & L(access_code_should_be_active=False))
                        | (models.Q(access_code_is_active=False) & L(access_code_should_be_active=True))
                    ),
                    access_code_generated_at__isnull=False,
                    end__gt=local_datetime(),
                    recurring_reservation=models.OuterRef("pk"),
                ),
            )
        ).filter(has_incorrect_access_codes=True)

    def for_application_round(self, ref: ApplicationRound | models.OuterRef) -> Self:
        """Return all reservations series for the given application round."""
        lookup = "allocated_time_slot__reservation_unit_option__application_section__application__application_round"
        return self.filter(**{lookup: ref})


class RecurringReservationManager(models.Manager.from_queryset(RecurringReservationQuerySet)): ...
