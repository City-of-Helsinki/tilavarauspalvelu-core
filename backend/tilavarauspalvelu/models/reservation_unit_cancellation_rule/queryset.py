from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitCancellationRule
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitCancellationRuleManager",
    "ReservationUnitCancellationRuleQuerySet",
]


class ReservationUnitCancellationRuleQuerySet(ModelQuerySet[ReservationUnitCancellationRule]): ...


class ReservationUnitCancellationRuleManager(
    ModelManager[ReservationUnitCancellationRule, ReservationUnitCancellationRuleQuerySet],
): ...
