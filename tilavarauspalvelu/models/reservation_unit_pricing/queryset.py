from django.db import models

from tilavarauspalvelu.enums import PricingStatus


class ReservationUnitPricingQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
