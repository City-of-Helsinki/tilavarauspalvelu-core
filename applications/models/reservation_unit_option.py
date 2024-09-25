from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from applications.querysets.reservation_unit_option import ReservationUnitOptionQuerySet
from common.connectors import ReservationUnitOptionActionsConnector

if TYPE_CHECKING:
    from applications.models import ApplicationSection
    from tilavarauspalvelu.models import ReservationUnit

__all__ = [
    "ReservationUnitOption",
]


class ReservationUnitOption(models.Model):
    preferred_order: int = models.PositiveIntegerField()
    rejected: bool = models.BooleanField(default=False, blank=True)
    locked: bool = models.BooleanField(default=False, blank=True)

    application_section: ApplicationSection = models.ForeignKey(
        "applications.ApplicationSection",
        on_delete=models.CASCADE,
        related_name="reservation_unit_options",
    )
    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="reservation_unit_options",
    )

    objects = ReservationUnitOptionQuerySet.as_manager()
    actions = ReservationUnitOptionActionsConnector()

    class Meta:
        db_table = "reservation_unit_option"
        base_manager_name = "objects"
        verbose_name = _("Reservation Unit Option")
        verbose_name_plural = _("Reservation Unit Options")
        ordering = [
            "pk",
        ]
        constraints = [
            models.UniqueConstraint(
                name="unique_application_section_preferred_order",
                fields=["application_section", "preferred_order"],
                # Allows swapping `preferred_order` of two reservation units
                # for the same application section in a transaction
                deferrable=models.Deferrable.DEFERRED,
                violation_error_message=_("Preferred order must be unique for each application section"),
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.preferred_order}) application section '{self.application_section.name}' "
            f"reservation unit '{self.reservation_unit.name}'"
        )
