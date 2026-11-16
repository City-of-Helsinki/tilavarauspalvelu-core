from __future__ import annotations

from tilavarauspalvelu.models import Sport
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "SportManager",
    "SportQuerySet",
]


class SportQuerySet(TranslatedModelQuerySet[Sport]): ...


class SportManager(ModelManager[Sport, SportQuerySet]): ...
