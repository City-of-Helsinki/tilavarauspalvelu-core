from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitHierarchy


__all__ = [
    "ReservationUnitHierarchyValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitHierarchyValidator:
    reservation_unit_hierarchy: ReservationUnitHierarchy
