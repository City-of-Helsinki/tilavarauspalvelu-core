from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ParticipantGender


__all__ = [
    "ParticipantGenderValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ParticipantGenderValidator:
    participant_gender: ParticipantGender
