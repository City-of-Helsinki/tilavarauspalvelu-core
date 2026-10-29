from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ApplicationRoundTimeSlotManager",
    "ApplicationRoundTimeSlotQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ApplicationRoundTimeSlot, covariant=True, default=ApplicationRoundTimeSlot)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ApplicationRoundTimeSlot)


class ApplicationRoundTimeSlotQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class ApplicationRoundTimeSlotManager(ModelManager[ApplicationRoundTimeSlot, ApplicationRoundTimeSlotQuerySet]): ...
