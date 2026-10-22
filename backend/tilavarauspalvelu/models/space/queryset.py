from __future__ import annotations

from tilavarauspalvelu.models import Space
from tilavarauspalvelu.models._base import ModelTreeQuerySet, TranslatedModelTreeManager

__all__ = [
    "SpaceManager",
    "SpaceQuerySet",
]


class SpaceQuerySet(ModelTreeQuerySet[Space]): ...


class SpaceManager(TranslatedModelTreeManager[Space, SpaceQuerySet]): ...
