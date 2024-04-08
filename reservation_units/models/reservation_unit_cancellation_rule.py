import datetime

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationUnitCancellationRule",
]


class ReservationUnitCancellationRule(models.Model):
    name = models.CharField(verbose_name=_("Name for the rule"), max_length=255, null=False, blank=False)
    can_be_cancelled_time_before = models.DurationField(
        verbose_name=_("Time before user can cancel reservations of this reservation unit"),
        blank=True,
        null=True,
        default=datetime.timedelta(hours=24),
        help_text="Seconds before reservations related to this cancellation rule can be cancelled without handling.",
    )
    needs_handling = models.BooleanField(
        default=False,
        verbose_name=_("Will the cancellation need manual staff handling"),
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    class Meta:
        db_table = "reservation_unit_cancellation_rule"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return self.name
