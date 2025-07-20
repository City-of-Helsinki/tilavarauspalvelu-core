from __future__ import annotations

from tilavarauspalvelu.models import RejectedOccurrence
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "RejectedOccurrenceManager",
    "RejectedOccurrenceQuerySet",
]


class RejectedOccurrenceQuerySet(ModelQuerySet[RejectedOccurrence]): ...


class RejectedOccurrenceManager(ModelManager[RejectedOccurrence, RejectedOccurrenceQuerySet]): ...
