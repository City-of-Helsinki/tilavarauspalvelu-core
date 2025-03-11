from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import AbilityGroupActions
    from .queryset import AbilityGroupManager
    from .validators import AbilityGroupValidator


__all__ = [
    "AbilityGroup",
]


class AbilityGroup(models.Model):
    name: str = models.TextField(unique=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[AbilityGroupManager] = LazyModelManager.new()
    actions: AbilityGroupActions = LazyModelAttribute.new()
    validators: AbilityGroupValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "ability_group"
        base_manager_name = "objects"
        verbose_name = _("ability group")
        verbose_name_plural = _("ability groups")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
