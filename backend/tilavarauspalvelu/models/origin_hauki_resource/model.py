from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import datetime

    from .actions import OriginHaukiResourceActions
    from .queryset import OriginHaukiResourceManager
    from .validators import OriginHaukiResourceValidator


__all__ = [
    "OriginHaukiResource",
]


class OriginHaukiResource(models.Model):
    # Resource id in Hauki API
    id: int = models.IntegerField(unique=True, primary_key=True)
    # Hauki API hash for opening hours, which is used to determine if the opening hours have changed
    opening_hours_hash: str = models.CharField(max_length=64, blank=True)
    # Latest date fetched from Hauki opening hours API
    latest_fetched_date: datetime.datetime.date = models.DateField(blank=True, null=True)

    objects: ClassVar[OriginHaukiResourceManager] = LazyModelManager.new()
    actions: OriginHaukiResourceActions = LazyModelAttribute.new()
    validators: OriginHaukiResourceValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "origin_hauki_resource"
        base_manager_name = "objects"
        verbose_name = _("origin hauki resource")
        verbose_name_plural = _("origin hauki resources")
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)
