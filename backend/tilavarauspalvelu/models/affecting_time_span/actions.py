from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import AffectingTimeSpan


class AffectingTimeSpanActions:
    def __init__(self, affecting_time_span: AffectingTimeSpan) -> None:
        self.affecting_time_span = affecting_time_span
