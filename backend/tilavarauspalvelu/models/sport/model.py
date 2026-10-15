from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet

    from .actions import SportActions
    from .queryset import SportManager
    from .validators import SportValidator


__all__ = [
    "Sport",
]


class Sport(models.Model):
    """Sport that an applicant can select on the sports application form."""

    rank = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[SportManager] = LazyModelManager.new()
    actions: LazyAttribute[SportActions] = LazyModelAttribute.new()
    validators: LazyAttribute[SportValidator] = LazyModelAttribute.new()

    application_sections: OneToManyRelatedManager[ApplicationSection, ApplicationSectionQuerySet]

    class Meta:
        db_table = "sport"
        base_manager_name = "objects"
        verbose_name = _("sport")
        verbose_name_plural = _("sports")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name
