from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from tilavarauspalvelu.enums import ResourceLocationType

from .queryset import ResourceManager

if TYPE_CHECKING:
    import datetime

    from spaces.models import Space

    from .actions import ResourceActions


__all__ = [
    "Resource",
]


class Resource(models.Model):
    location_type: str = models.CharField(
        max_length=20,
        choices=ResourceLocationType.choices,
        default=ResourceLocationType.FIXED.value,
    )
    name: str = models.CharField(max_length=255)
    space: Space | None = models.ForeignKey("spaces.Space", on_delete=models.SET_NULL, null=True, blank=True)
    buffer_time_before: datetime.timedelta | None = models.DurationField(blank=True, null=True)
    buffer_time_after: datetime.timedelta | None = models.DurationField(blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ResourceManager()

    class Meta:
        db_table = "resource"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        value = self.name
        if self.space is not None:
            value += f" ({self.space!s})"
        return value

    @cached_property
    def actions(self) -> ResourceActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ResourceActions

        return ResourceActions(self)
