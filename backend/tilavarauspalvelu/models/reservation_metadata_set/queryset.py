from __future__ import annotations

from tilavarauspalvelu.models import ReservationMetadataSet
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationMetadataSetManager",
    "ReservationMetadataSetQuerySet",
]


class ReservationMetadataSetQuerySet(ModelQuerySet[ReservationMetadataSet]): ...


class ReservationMetadataSetManager(ModelManager[ReservationMetadataSet, ReservationMetadataSetQuerySet]): ...
