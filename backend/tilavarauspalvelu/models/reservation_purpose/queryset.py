from __future__ import annotations

from tilavarauspalvelu.models import ReservationPurpose
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationPurposeManager",
    "ReservationPurposeQuerySet",
]


class ReservationPurposeQuerySet(ModelQuerySet[ReservationPurpose]): ...


class ReservationPurposeManager(ModelManager[ReservationPurpose, ReservationPurposeQuerySet]): ...
