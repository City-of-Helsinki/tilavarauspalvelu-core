from __future__ import annotations

from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ApplicationRoundTimeSlotManager",
    "ApplicationRoundTimeSlotQuerySet",
]


class ApplicationRoundTimeSlotQuerySet(ModelQuerySet[ApplicationRoundTimeSlot]): ...


class ApplicationRoundTimeSlotManager(ModelManager[ApplicationRoundTimeSlot, ApplicationRoundTimeSlotQuerySet]): ...
