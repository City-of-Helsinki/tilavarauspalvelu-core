from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationUnitCancellationRule
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitCancellationRuleManager",
    "ReservationUnitCancellationRuleQuerySet",
]


_TModel_co = TypeVar(
    "_TModel_co", bound=ReservationUnitCancellationRule, covariant=True, default=ReservationUnitCancellationRule
)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationUnitCancellationRule)


class ReservationUnitCancellationRuleQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationUnitCancellationRuleManager(
    ModelManager[ReservationUnitCancellationRule, ReservationUnitCancellationRuleQuerySet],
): ...
