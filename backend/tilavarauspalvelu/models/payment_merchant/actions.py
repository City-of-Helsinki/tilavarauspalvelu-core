from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentMerchant

__all__ = [
    "PaymentMerchantActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentMerchantActions:
    payment_merchant: PaymentMerchant
