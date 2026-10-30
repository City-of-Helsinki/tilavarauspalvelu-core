from __future__ import annotations

from typing import Self

from django.db import models

from tilavarauspalvelu.models import ReservationUnitPricingGroup
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date

__all__ = [
    "ReservationUnitPricingGroupManager",
    "ReservationUnitPricingGroupQuerySet",
]


class ReservationUnitPricingGroupQuerySet(ModelQuerySet[ReservationUnitPricingGroup]):
    def exclude_past(self) -> Self:
        """Return the active and future rows of each reservation unit."""
        today = local_date()

        return self.alias(
            active_begins=models.Subquery(
                self.model.objects
                .filter(
                    reservation_unit=models.OuterRef("reservation_unit"),
                    begins__lte=today,
                )
                .values("begins")
                .order_by("-begins")[:1]
            )
        ).filter(models.Q(begins__gte=models.F("active_begins")) | models.Q(active_begins__isnull=True))


class ReservationUnitPricingGroupManager(
    ModelManager[ReservationUnitPricingGroup, ReservationUnitPricingGroupQuerySet],
): ...
