from __future__ import annotations

from tilavarauspalvelu.models import ParticipantGender
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "ParticipantGenderManager",
    "ParticipantGenderQuerySet",
]


class ParticipantGenderQuerySet(TranslatedModelQuerySet[ParticipantGender]): ...


class ParticipantGenderManager(ModelManager[ParticipantGender, ParticipantGenderQuerySet]): ...
