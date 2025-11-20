from __future__ import annotations

from tilavarauspalvelu.models import ReservationPurpose
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "ReservationPurposeManager",
    "ReservationPurposeQuerySet",
]


class ReservationPurposeQuerySet(TranslatedModelQuerySet[ReservationPurpose]): ...


class ReservationPurposeManager(ModelManager[ReservationPurpose, ReservationPurposeQuerySet]): ...
