from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.exceptions import TaxLevelHasNoRateError

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from .model import TaxLevel


__all__ = [
    "TaxLevelActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TaxLevelActions:
    tax_level: TaxLevel

    def get_percentage(self, *, on_date: datetime.date) -> Decimal:
        """Get the tax percentage of the rate that is in effect on the given date."""
        rate = self.tax_level.rates.effective_on(on_date=on_date).first()
        if rate is None:
            msg = f"Tax level '{self.tax_level}' has no rate on {on_date.isoformat()}"
            raise TaxLevelHasNoRateError(msg)

        return rate.percentage
