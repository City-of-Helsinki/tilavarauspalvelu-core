from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AbilityGroup


__all__ = [
    "AbilityGroupValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AbilityGroupValidator:
    ability_group: AbilityGroup
