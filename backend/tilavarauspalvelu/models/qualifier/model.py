from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import QualifierActions
    from .queryset import QualifierManager
    from .validators import QualifierValidator


__all__ = [
    "Qualifier",
]


class Qualifier(models.Model):
    name: str = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[QualifierManager] = LazyModelManager.new()
    actions: QualifierActions = LazyModelAttribute.new()
    validators: QualifierValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "qualifier"
        base_manager_name = "objects"
        verbose_name = _("qualifier")
        verbose_name_plural = _("qualifiers")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
