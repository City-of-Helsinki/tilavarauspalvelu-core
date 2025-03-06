from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationMetadataSet


__all__ = [
    "ReservationMetadataSetValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationMetadataSetValidator:
    reservation_metadata_set: ReservationMetadataSet
