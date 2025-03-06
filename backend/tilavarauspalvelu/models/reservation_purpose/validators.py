from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationPurpose


__all__ = [
    "ReservationPurposeValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationPurposeValidator:
    reservation_purpose: ReservationPurpose
