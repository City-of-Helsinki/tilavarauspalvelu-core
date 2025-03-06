from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationMetadataSet


__all__ = [
    "ReservationMetadataSetActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationMetadataSetActions:
    reservation_unit_metadata_set: ReservationMetadataSet
