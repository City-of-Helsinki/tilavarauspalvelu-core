from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PersonalInfoViewLog


__all__ = [
    "PersonalInfoViewLogValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PersonalInfoViewLogValidator:
    personal_info_view_log: PersonalInfoViewLog
