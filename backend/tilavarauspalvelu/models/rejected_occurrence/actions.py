from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import RejectedOccurrence

__all__ = [
    "RejectedOccurrenceActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class RejectedOccurrenceActions:
    rejected_occurrence: RejectedOccurrence
