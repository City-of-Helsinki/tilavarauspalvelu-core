from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import pgettext_lazy

from tilavarauspalvelu.enums import TermsOfUseTypeChoices
from utils.auditlog_util import AuditLogger
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import TermsOfUseActions
    from .queryset import TermsOfUseManager
    from .validators import TermsOfUseValidator

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

    objects: ClassVar[TermsOfUseManager] = LazyModelManager.new()
    actions: TermsOfUseActions = LazyModelAttribute.new()
    validators: TermsOfUseValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "terms_of_use"
        base_manager_name = "objects"
        verbose_name = pgettext_lazy("singular", "terms of use")
        verbose_name_plural = pgettext_lazy("plural", "terms of use")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name


AuditLogger.register(TermsOfUse)
