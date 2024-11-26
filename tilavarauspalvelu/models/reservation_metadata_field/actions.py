from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationMetadataField


class ReservationMetadataFieldActions:
    def __init__(self, reservation_unit_metadata_field: ReservationMetadataField) -> None:
        self.reservation_unit_metadata_field = reservation_unit_metadata_field
