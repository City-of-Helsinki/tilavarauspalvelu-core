from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime
from utils.db import Now

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound

__all__ = [
    "ReservationSeriesManager",
    "ReservationSeriesQuerySet",
]


class ReservationSeriesQuerySet(models.QuerySet):
    def requiring_access_code(self) -> Self:
        """Return all reservation series that should have an access code but don't."""
        return self.alias(
            has_missing_access_codes=models.Exists(
                queryset=Reservation.objects.filter(
                    reservation_series=models.OuterRef("pk"),
                    state=ReservationStateChoice.CONFIRMED,
                    access_type=AccessType.ACCESS_CODE,
                    access_code_generated_at=None,
                    ends_at__gt=Now(),
                ),
            )
        ).filter(has_missing_access_codes=True)

    def should_have_active_access_code(self) -> Self:
        """Return all reservation series should have an active access code."""
        return self.filter(L(should_have_active_access_code=True))

    def has_incorrect_access_code_is_active(self) -> Self:
        """
        Return all reservation series where the access code is active
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
                    ends_at__gt=local_datetime(),
                    reservation_series=models.OuterRef("pk"),
                ),
            )
        ).filter(has_incorrect_access_codes=True)

    def for_application_round(self, ref: ApplicationRound | models.OuterRef) -> Self:
        """Return all reservations series for the given application round."""
        lookup = "allocated_time_slot__reservation_unit_option__application_section__application__application_round"
        return self.filter(**{lookup: ref})


# Need to do this to get proper type hints in the manager methods, since
# 'from_queryset' returns a subclass of Manager, but is not typed correctly...
_BaseManager: type[models.Manager] = models.Manager.from_queryset(ReservationSeriesQuerySet)  # type: ignore[assignment]


class ReservationSeriesManager(_BaseManager):
    # Define to get type hints for queryset methods.
    def all(self) -> ReservationSeriesQuerySet:
        return super().all()  # type: ignore[return-value]
