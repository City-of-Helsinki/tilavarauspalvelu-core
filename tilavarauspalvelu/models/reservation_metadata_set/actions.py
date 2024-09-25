from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationMetadataSet


class ReservationMetadataSetActions:
    def __init__(self, reservation_unit_metadata_set: "ReservationMetadataSet") -> None:
        self.reservation_unit_metadata_set = reservation_unit_metadata_set
