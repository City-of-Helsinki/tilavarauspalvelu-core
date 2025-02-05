from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentMerchant

__all__ = [
    "PaymentMerchantActions",
]


class PaymentMerchantActions:
    def __init__(self, payment_merchant: PaymentMerchant) -> None:
        self.payment_merchant = payment_merchant
