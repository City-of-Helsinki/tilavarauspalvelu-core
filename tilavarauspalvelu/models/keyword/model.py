from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import KeywordQuerySet

if TYPE_CHECKING:
    from .actions import KeywordActions

__all__ = [
    "Keyword",
]


class Keyword(models.Model):
    name = models.CharField(max_length=255)

    keyword_group = models.ForeignKey(
        "tilavarauspalvelu.KeywordGroup",
        related_name="keywords",
        on_delete=models.PROTECT,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = KeywordQuerySet.as_manager()

    class Meta:
        db_table = "keyword"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.name}"

    @cached_property
    def actions(self) -> KeywordActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import KeywordActions

        return KeywordActions(self)
