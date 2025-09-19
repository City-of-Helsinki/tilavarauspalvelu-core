from __future__ import annotations

from tilavarauspalvelu.models import IntendedUse
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "IntendedUseManager",
    "IntendedUseQuerySet",
]


class IntendedUseQuerySet(ModelQuerySet[IntendedUse]): ...


class IntendedUseManager(ModelManager[IntendedUse, IntendedUseQuerySet]): ...
