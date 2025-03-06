from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import RejectedOccurrence


__all__ = [
    "RejectedOccurrenceValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class RejectedOccurrenceValidator:
    rejected_occurrence: RejectedOccurrence
