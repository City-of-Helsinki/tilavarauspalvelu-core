from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TaxPercentage


__all__ = [
    "TaxPercentageValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TaxPercentageValidator:
    tax_percentage: TaxPercentage
