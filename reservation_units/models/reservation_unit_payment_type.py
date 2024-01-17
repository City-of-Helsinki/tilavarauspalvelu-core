from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationUnitPaymentType",
]


class ReservationUnitPaymentType(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=32, blank=False, null=False, primary_key=True)

    def __str__(self):
        return self.code
