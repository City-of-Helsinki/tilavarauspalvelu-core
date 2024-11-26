from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TaxPercentage


class TaxPercentageActions:
    def __init__(self, tax_percentage: TaxPercentage) -> None:
        self.tax_percentage = tax_percentage
