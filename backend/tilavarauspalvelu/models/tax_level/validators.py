from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

if TYPE_CHECKING:
    from .model import TaxLevel


__all__ = [
    "TaxLevelValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TaxLevelValidator:
    tax_level: TaxLevel

    def validate_has_rate_today(self) -> None:
        today = local_date()
        has_rate = self.tax_level.rates.effective_on(on_date=today).exists()
        if not has_rate:
            msg = f"Tax level '{self.tax_level}' has no rate in effect today."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_TAX_LEVEL_HAS_NO_RATE)
