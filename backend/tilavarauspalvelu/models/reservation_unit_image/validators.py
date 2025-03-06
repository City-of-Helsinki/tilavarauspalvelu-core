from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitImage


__all__ = [
    "ReservationUnitImageValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitImageValidator:
    reservation_unit_image: ReservationUnitImage
