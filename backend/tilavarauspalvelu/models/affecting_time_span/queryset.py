from __future__ import annotations

from tilavarauspalvelu.models import AffectingTimeSpan
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "AffectingTimeSpanManager",
    "AffectingTimeSpanQuerySet",
]


class AffectingTimeSpanQuerySet(ModelQuerySet[AffectingTimeSpan]): ...


class AffectingTimeSpanManager(ModelManager[AffectingTimeSpan, AffectingTimeSpanQuerySet]): ...
