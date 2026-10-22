from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitCancellationRule
from tilavarauspalvelu.models._base import ModelQuerySet, TranslatedModelManager

__all__ = [
    "ReservationUnitCancellationRuleManager",
    "ReservationUnitCancellationRuleQuerySet",
]


class ReservationUnitCancellationRuleQuerySet(ModelQuerySet[ReservationUnitCancellationRule]): ...


class ReservationUnitCancellationRuleManager(
    TranslatedModelManager[ReservationUnitCancellationRule, ReservationUnitCancellationRuleQuerySet],
): ...
