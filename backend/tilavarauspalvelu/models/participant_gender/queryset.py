from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ParticipantGender
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "ParticipantGenderManager",
    "ParticipantGenderQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ParticipantGender, covariant=True, default=ParticipantGender)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ParticipantGender)


class ParticipantGenderQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class ParticipantGenderManager(ModelManager[ParticipantGender, ParticipantGenderQuerySet]): ...
