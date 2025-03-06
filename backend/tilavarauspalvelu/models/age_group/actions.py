from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import AgeGroup


__all__ = [
    "AgeGroupActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AgeGroupActions:
    age_group: AgeGroup
