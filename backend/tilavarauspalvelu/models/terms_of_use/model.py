from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import pgettext_lazy

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import TermsOfUseTypeChoices

from .queryset import TermsOfUseManager

if TYPE_CHECKING:
    from .actions import TermsOfUseActions

__all__ = [
    "TermsOfUse",
]


class TermsOfUse(models.Model):
    id: str = models.CharField(primary_key=True, max_length=100)
    name: str | None = models.CharField(max_length=255, null=True, blank=True)
    text: str = models.TextField()

    terms_type: str = models.CharField(
        blank=False,
        max_length=40,
        choices=TermsOfUseTypeChoices.choices,
        default=TermsOfUseTypeChoices.GENERIC,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None
    text_fi: str | None
    text_en: str | None
    text_sv: str | None

    objects = TermsOfUseManager()

    class Meta:
        db_table = "terms_of_use"
        base_manager_name = "objects"
        verbose_name = pgettext_lazy("singular", "terms of use")
        verbose_name_plural = pgettext_lazy("plural", "terms of use")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> TermsOfUseActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import TermsOfUseActions

        return TermsOfUseActions(self)


AuditLogger.register(TermsOfUse)
