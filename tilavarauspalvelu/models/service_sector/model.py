from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ServiceSectorManager

if TYPE_CHECKING:
    from .actions import ServiceSectorActions

__all__ = [
    "ServiceSector",
]


class ServiceSector(models.Model):
    """
    Model representation of Service Sector that contains and manages
    units and application periods.
    """

    name: str = models.CharField(max_length=255)

    units = models.ManyToManyField("tilavarauspalvelu.Unit", related_name="service_sectors")

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ServiceSectorManager()

    class Meta:
        db_table = "service_sector"
        base_manager_name = "objects"
        verbose_name = _("service sector")
        verbose_name_plural = _("service sectors")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ServiceSectorActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ServiceSectorActions

        return ServiceSectorActions(self)
