from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import GeneralRole


__all__ = [
    "GeneralRoleActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class GeneralRoleActions:
    general_role: GeneralRole
