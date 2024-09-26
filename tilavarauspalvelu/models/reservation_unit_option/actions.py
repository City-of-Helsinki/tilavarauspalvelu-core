from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitOption


class ReservationUnitOptionActions:
    def __init__(self, reservation_unit_options: "ReservationUnitOption") -> None:
        self.reservation_unit_options = reservation_unit_options
