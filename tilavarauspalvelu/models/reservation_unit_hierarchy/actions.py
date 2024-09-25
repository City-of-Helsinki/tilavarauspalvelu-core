from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitHierarchy


class ReservationUnitHierarchyActions:
    def __init__(self, reservation_unit_hierarchy: "ReservationUnitHierarchy") -> None:
        self.reservation_unit_hierarchy = reservation_unit_hierarchy
