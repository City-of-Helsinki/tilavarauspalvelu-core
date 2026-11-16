from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ParticipantGender


__all__ = [
    "ParticipantGenderActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ParticipantGenderActions:
    participant_gender: ParticipantGender
