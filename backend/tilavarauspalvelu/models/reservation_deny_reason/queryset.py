from __future__ import annotations

from tilavarauspalvelu.models import ReservationDenyReason
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationDenyReasonManager",
    "ReservationDenyReasonQuerySet",
]


class ReservationDenyReasonQuerySet(ModelQuerySet[ReservationDenyReason]): ...


class ReservationDenyReasonManager(ModelManager[ReservationDenyReason, ReservationDenyReasonQuerySet]): ...
