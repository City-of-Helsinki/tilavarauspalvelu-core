from __future__ import annotations

from tilavarauspalvelu.models import TaxLevel
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "TaxLevelManager",
    "TaxLevelQuerySet",
]


class TaxLevelQuerySet(ModelQuerySet[TaxLevel]): ...


class TaxLevelManager(ModelManager[TaxLevel, TaxLevelQuerySet]): ...
