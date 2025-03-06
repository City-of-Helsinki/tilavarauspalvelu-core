from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound


__all__ = [
    "ApplicationRoundValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationRoundValidator:
    application_round: ApplicationRound
