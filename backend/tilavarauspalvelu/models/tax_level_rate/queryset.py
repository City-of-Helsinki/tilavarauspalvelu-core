from __future__ import annotations

from typing import TYPE_CHECKING, Self

from tilavarauspalvelu.models import TaxLevelRate
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

if TYPE_CHECKING:
    import datetime

__all__ = [
    "TaxLevelRateManager",
    "TaxLevelRateQuerySet",
]


class TaxLevelRateQuerySet(ModelQuerySet[TaxLevelRate]):
    def effective_on(self, *, on_date: datetime.date) -> Self:
        """Get rates that begin on or before the given date, ordered from most recent to oldest."""
        return self.filter(begins__lte=on_date).order_by("-begins")


class TaxLevelRateManager(ModelManager[TaxLevelRate, TaxLevelRateQuerySet]): ...
