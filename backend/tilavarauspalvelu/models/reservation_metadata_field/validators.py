from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationMetadataField


__all__ = [
    "ReservationMetadataFieldValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationMetadataFieldValidator:
    reservation_metadata_field: ReservationMetadataField
