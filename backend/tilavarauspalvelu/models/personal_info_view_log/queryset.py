from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PersonalInfoViewLog
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PersonalInfoViewLogManager",
    "PersonalInfoViewLogQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PersonalInfoViewLog, covariant=True, default=PersonalInfoViewLog)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PersonalInfoViewLog)


class PersonalInfoViewLogQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class PersonalInfoViewLogManager(ModelManager[PersonalInfoViewLog, PersonalInfoViewLogQuerySet]): ...
