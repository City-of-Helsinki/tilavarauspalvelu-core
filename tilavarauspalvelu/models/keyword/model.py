from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import KeywordManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import KeywordGroup

    from .actions import KeywordActions

__all__ = [
    "Keyword",
]


class Keyword(models.Model):
    name: str = models.CharField(max_length=255)

    keyword_group: KeywordGroup = models.ForeignKey(
        "tilavarauspalvelu.KeywordGroup",
        related_name="keywords",
        on_delete=models.PROTECT,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = KeywordManager()

    class Meta:
        db_table = "keyword"
        base_manager_name = "objects"
        verbose_name = _("keyword")
        verbose_name_plural = _("keywords")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.name}"

    @cached_property
    def actions(self) -> KeywordActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import KeywordActions

        return KeywordActions(self)
