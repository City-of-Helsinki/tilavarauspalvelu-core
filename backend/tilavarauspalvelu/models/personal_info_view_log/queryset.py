from __future__ import annotations

from tilavarauspalvelu.models import PersonalInfoViewLog
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PersonalInfoViewLogManager",
    "PersonalInfoViewLogQuerySet",
]


class PersonalInfoViewLogQuerySet(ModelQuerySet[PersonalInfoViewLog]): ...


class PersonalInfoViewLogManager(ModelManager[PersonalInfoViewLog, PersonalInfoViewLogQuerySet]): ...
