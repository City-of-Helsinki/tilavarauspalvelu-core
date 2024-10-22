from django.db import models

from tilavarauspalvelu.enums import PricingStatus

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]


class ReservationUnitPricingQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()


class ReservationUnitPricingManager(models.Manager.from_queryset(ReservationUnitPricingQuerySet)): ...
