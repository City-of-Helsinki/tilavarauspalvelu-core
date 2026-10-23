from __future__ import annotations

from tilavarauspalvelu.models import ReservationPriceLine
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationPriceLineManager",
    "ReservationPriceLineQuerySet",
]


class ReservationPriceLineQuerySet(ModelQuerySet[ReservationPriceLine]): ...


class ReservationPriceLineManager(ModelManager[ReservationPriceLine, ReservationPriceLineQuerySet]): ...
