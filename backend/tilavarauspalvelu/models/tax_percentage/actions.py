from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TaxPercentage


__all__ = [
    "TaxPercentageActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TaxPercentageActions:
    tax_percentage: TaxPercentage
