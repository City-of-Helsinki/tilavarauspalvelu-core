from __future__ import annotations

from tilavarauspalvelu.models import ReservationDenyReason
from tilavarauspalvelu.models._base import ModelQuerySet, TranslatedModelManager

__all__ = [
    "ReservationDenyReasonManager",
    "ReservationDenyReasonQuerySet",
]


class ReservationDenyReasonQuerySet(ModelQuerySet[ReservationDenyReason]): ...


class ReservationDenyReasonManager(TranslatedModelManager[ReservationDenyReason, ReservationDenyReasonQuerySet]): ...
