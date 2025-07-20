from __future__ import annotations

from tilavarauspalvelu.models import TaxPercentage
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "TaxPercentageManager",
    "TaxPercentageQuerySet",
]


class TaxPercentageQuerySet(ModelQuerySet[TaxPercentage]): ...


class TaxPercentageManager(ModelManager[TaxPercentage, TaxPercentageQuerySet]): ...
