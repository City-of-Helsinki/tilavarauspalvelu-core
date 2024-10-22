from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import KeywordGroupManager

if TYPE_CHECKING:
    from .actions import KeywordGroupActions


class KeywordGroup(models.Model):
    name = models.CharField(max_length=255)

    keyword_category = models.ForeignKey(
        "tilavarauspalvelu.KeywordCategory",
        related_name="keyword_groups",
        on_delete=models.PROTECT,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = KeywordGroupManager()

    class Meta:
        db_table = "keyword_group"
        base_manager_name = "objects"
        verbose_name = _("keyword group")
        verbose_name_plural = _("keyword groups")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.name}"

    @cached_property
    def actions(self) -> KeywordGroupActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import KeywordGroupActions

        return KeywordGroupActions(self)
