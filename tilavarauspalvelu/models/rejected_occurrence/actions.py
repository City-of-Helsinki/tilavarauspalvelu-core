from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import RejectedOccurrence

__all__ = [
    "RejectedOccurrenceActions",
]


class RejectedOccurrenceActions:
    def __init__(self, rejected_occurrence: RejectedOccurrence) -> None:
        self.rejected_occurrence = rejected_occurrence
