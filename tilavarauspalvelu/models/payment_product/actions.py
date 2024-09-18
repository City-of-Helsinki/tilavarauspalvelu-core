from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentProduct

__all__ = [
    "PaymentProductActions",
]


class PaymentProductActions:
    def __init__(self, payment_product: PaymentProduct) -> None:
        self.payment_product = payment_product
