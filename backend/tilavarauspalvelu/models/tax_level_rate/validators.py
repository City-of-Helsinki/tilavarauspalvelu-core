from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TaxLevelRate


__all__ = [
    "TaxLevelRateValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TaxLevelRateValidator:
    tax_level_rate: TaxLevelRate
