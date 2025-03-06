from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Purpose


__all__ = [
    "PurposeActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PurposeActions:
    purpose: Purpose
