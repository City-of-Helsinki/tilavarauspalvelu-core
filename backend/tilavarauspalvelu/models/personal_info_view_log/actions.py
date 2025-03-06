from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PersonalInfoViewLog


__all__ = [
    "PersonalInfoViewLogActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PersonalInfoViewLogActions:
    personal_info_view_log: PersonalInfoViewLog
