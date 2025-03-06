from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AffectingTimeSpan


__all__ = [
    "AffectingTimeSpanValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AffectingTimeSpanValidator:
    affecting_time_span: AffectingTimeSpan
