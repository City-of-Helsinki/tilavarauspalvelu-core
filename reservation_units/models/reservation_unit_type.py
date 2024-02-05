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

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "reservation_unit_type"
        base_manager_name = "objects"
        ordering = ["rank"]

    def __str__(self):
        return self.name
