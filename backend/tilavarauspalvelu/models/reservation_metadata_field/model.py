from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationMetadataField",
]


class ReservationMetadataField(models.Model):
    field_name: str = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "reservation_metadata_field"
        base_manager_name = "objects"
        verbose_name = _("reservation metadata field")
        verbose_name_plural = _("reservation metadata fields")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.field_name
