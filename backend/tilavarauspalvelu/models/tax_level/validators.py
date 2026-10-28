from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TaxLevel


__all__ = [
    "TaxLevelValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TaxLevelValidator:
    tax_level: TaxLevel
