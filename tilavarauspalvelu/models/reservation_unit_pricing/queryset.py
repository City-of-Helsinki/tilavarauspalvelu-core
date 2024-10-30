from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]

from utils.date_utils import local_date


class ReservationUnitPricingQuerySet(models.QuerySet):
    def exclude_past(self) -> models.QuerySet:
        """Return all currently active and future pricings."""
        today = local_date()

        return self.alias(
            reservation_unit_active_pricing_begins_date=models.Subquery(
                self.model.objects.filter(
                    reservation_unit=models.OuterRef("reservation_unit"),
                    begins__lte=today,
                )
                .values("begins")
                .order_by("-begins")[:1]
            )
        ).filter(begins__gte=models.F("reservation_unit_active_pricing_begins_date"))


class ReservationUnitPricingManager(models.Manager.from_queryset(ReservationUnitPricingQuerySet)): ...
