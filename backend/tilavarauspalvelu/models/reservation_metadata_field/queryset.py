from __future__ import annotations

from tilavarauspalvelu.models import ReservationMetadataField
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationMetadataFieldManager",
    "ReservationMetadataFieldQuerySet",
]


class ReservationMetadataFieldQuerySet(ModelQuerySet[ReservationMetadataField]): ...


class ReservationMetadataFieldManager(ModelManager[ReservationMetadataField, ReservationMetadataFieldQuerySet]): ...
