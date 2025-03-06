from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationMetadataField


__all__ = [
    "ReservationMetadataFieldActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationMetadataFieldActions:
    reservation_unit_metadata_field: ReservationMetadataField
