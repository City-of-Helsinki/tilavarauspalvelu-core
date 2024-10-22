from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import KeywordCategoryManager

if TYPE_CHECKING:
    from .actions import KeywordCategoryActions

__all__ = [
    "KeywordCategory",
]


class KeywordCategory(models.Model):
    name = models.CharField(max_length=255)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = KeywordCategoryManager()

    class Meta:
        db_table = "keyword_category"
        base_manager_name = "objects"
        verbose_name = _("keyword category")
        verbose_name_plural = _("keyword categories")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.name}"

    @cached_property
    def actions(self) -> KeywordCategoryActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import KeywordCategoryActions

        return KeywordCategoryActions(self)
