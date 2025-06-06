from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Qualifier


__all__ = [
    "QualifierActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class QualifierActions:
    qualifier: Qualifier
