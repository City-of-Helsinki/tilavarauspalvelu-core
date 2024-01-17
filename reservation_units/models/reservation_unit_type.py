from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationUnitType",
]


class ReservationUnitType(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be used in api sorting."),
    )

    class Meta:
        ordering = ["rank"]

    def __str__(self):
        return self.name
