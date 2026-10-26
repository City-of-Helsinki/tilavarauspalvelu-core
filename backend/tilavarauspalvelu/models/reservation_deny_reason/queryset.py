from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationDenyReason
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationDenyReasonManager",
    "ReservationDenyReasonQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservationDenyReason, covariant=True, default=ReservationDenyReason)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationDenyReason)


class ReservationDenyReasonQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationDenyReasonManager(ModelManager[ReservationDenyReason, ReservationDenyReasonQuerySet]): ...
