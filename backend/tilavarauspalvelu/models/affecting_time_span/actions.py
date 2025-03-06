from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import AffectingTimeSpan


__all__ = [
    "AffectingTimeSpanActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AffectingTimeSpanActions:
    affecting_time_span: AffectingTimeSpan
