from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationPurpose
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "ReservationPurposeManager",
    "ReservationPurposeQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservationPurpose, covariant=True, default=ReservationPurpose)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationPurpose)


class ReservationPurposeQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationPurposeManager(TranslatedModelManager[ReservationPurpose, ReservationPurposeQuerySet]): ...
