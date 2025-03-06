from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import SuitableTimeRange


__all__ = [
    "SuitableTimeRangeActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SuitableTimeRangeActions:
    suitable_time_range: SuitableTimeRange
