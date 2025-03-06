from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentMerchant


__all__ = [
    "PaymentMerchantValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentMerchantValidator:
    payment_merchant: PaymentMerchant
