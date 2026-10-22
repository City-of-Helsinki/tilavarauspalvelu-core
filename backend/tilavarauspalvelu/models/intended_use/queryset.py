from __future__ import annotations

from tilavarauspalvelu.models import IntendedUse
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "IntendedUseManager",
    "IntendedUseQuerySet",
]


class IntendedUseQuerySet(TranslatedModelQuerySet[IntendedUse]): ...


class IntendedUseManager(TranslatedModelManager[IntendedUse, IntendedUseQuerySet]): ...
