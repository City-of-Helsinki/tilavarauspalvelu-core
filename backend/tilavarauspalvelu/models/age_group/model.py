from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import AgeGroupActions
    from .queryset import AgeGroupManager
    from .validators import AgeGroupValidator

__all__ = [
    "AgeGroup",
]


class AgeGroup(models.Model):
    minimum: int = models.PositiveIntegerField()
    maximum: int | None = models.PositiveIntegerField(null=True, blank=True)

    objects: ClassVar[AgeGroupManager] = LazyModelManager.new()
    actions: AgeGroupActions = LazyModelAttribute.new()
    validators: AgeGroupValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "age_group"
        base_manager_name = "objects"
        verbose_name = _("age group")
        verbose_name_plural = _("age groups")
        ordering = ["pk"]

    def __str__(self) -> str:
        if self.maximum is None:
            return f"{self.minimum}+"
        return f"{self.minimum} - {self.maximum}"
