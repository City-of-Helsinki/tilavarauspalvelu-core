from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import ServiceTypeChoices

from .queryset import ServiceManager

if TYPE_CHECKING:
    import datetime

    from .actions import ServiceActions


__all__ = [
    "Service",
]


class Service(models.Model):
    name: str = models.CharField(max_length=255)

    service_type: str = models.CharField(
        max_length=50,
        choices=ServiceTypeChoices.choices,
        default=ServiceTypeChoices.INTRODUCTION,
    )

    buffer_time_before: datetime.timedelta | None = models.DurationField(blank=True, null=True)
    buffer_time_after: datetime.timedelta | None = models.DurationField(blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ServiceManager()

    class Meta:
        db_table = "service"
        base_manager_name = "objects"
        verbose_name = _("service")
        verbose_name_plural = _("services")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.name} ({self.service_type})"

    @cached_property
    def actions(self) -> ServiceActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ServiceActions

        return ServiceActions(self)
