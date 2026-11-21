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

    from .actions import ParticipantGenderActions
    from .queryset import ParticipantGenderManager
    from .validators import ParticipantGenderValidator


__all__ = [
    "ParticipantGender",
]


class ParticipantGender(models.Model):
    """
    Gender of the participants in an application section, e.g. women, men or mixed.
    Describes the type of the group, for example for dressing rooms.
    """

    rank = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[ParticipantGenderManager] = LazyModelManager.new()
    actions: LazyAttribute[ParticipantGenderActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ParticipantGenderValidator] = LazyModelAttribute.new()

    application_sections: OneToManyRelatedManager[ApplicationSection, ApplicationSectionQuerySet]

    class Meta:
        db_table = "participant_gender"
        base_manager_name = "objects"
        verbose_name = _("participant gender")
        verbose_name_plural = _("participant genders")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name
