from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import SuitableTimeRange


__all__ = [
    "SuitableTimeRangeValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SuitableTimeRangeValidator:
    suitable_time_range: SuitableTimeRange
