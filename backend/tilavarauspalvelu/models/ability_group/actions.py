from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import AbilityGroup


__all__ = [
    "AbilityGroupActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AbilityGroupActions:
    ability_group: AbilityGroup
