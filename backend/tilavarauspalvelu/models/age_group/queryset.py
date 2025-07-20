from __future__ import annotations

from tilavarauspalvelu.models import AgeGroup
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "AgeGroupManager",
    "AgeGroupQuerySet",
]


class AgeGroupQuerySet(ModelQuerySet[AgeGroup]): ...


class AgeGroupManager(ModelManager[AgeGroup, AgeGroupQuerySet]): ...
