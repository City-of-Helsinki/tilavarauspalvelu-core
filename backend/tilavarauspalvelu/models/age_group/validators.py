from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AgeGroup


__all__ = [
    "AgeGroupValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AgeGroupValidator:
    age_group: AgeGroup
