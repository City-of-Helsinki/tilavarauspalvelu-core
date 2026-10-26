from __future__ import annotations

from typing import TYPE_CHECKING, Self, TypeVar

from tilavarauspalvelu.models import TaxLevelRate
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

if TYPE_CHECKING:
    import datetime

__all__ = [
    "TaxLevelRateManager",
    "TaxLevelRateQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=TaxLevelRate, covariant=True, default=TaxLevelRate)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=TaxLevelRate)


class TaxLevelRateQuerySet(ModelQuerySet[_TModel_co, _TRow_co]):
    def effective_on(self, *, on_date: datetime.date) -> Self:
        """Get rates that begin on or before the given date, ordered from most recent to oldest."""
        return self.filter(begins__lte=on_date).order_by("-begins")


class TaxLevelRateManager(ModelManager[TaxLevelRate, TaxLevelRateQuerySet]): ...
