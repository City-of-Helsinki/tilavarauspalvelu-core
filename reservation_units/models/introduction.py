from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "Introduction",
]


class Introduction(models.Model):
    user = models.ForeignKey(
        "tilavarauspalvelu.User",
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )
    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        verbose_name=_("Reservation unit"),
        on_delete=models.CASCADE,
    )

    completed_at = models.DateTimeField(verbose_name=_("Completed at"))

    class Meta:
        db_table = "introduction"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"Introduction - {self.user}, {self.reservation_unit} ({self.completed_at})"
