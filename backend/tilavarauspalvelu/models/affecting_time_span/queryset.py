from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import AffectingTimeSpan
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "AffectingTimeSpanManager",
    "AffectingTimeSpanQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=AffectingTimeSpan, covariant=True, default=AffectingTimeSpan)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=AffectingTimeSpan)


class AffectingTimeSpanQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class AffectingTimeSpanManager(ModelManager[AffectingTimeSpan, AffectingTimeSpanQuerySet]): ...
