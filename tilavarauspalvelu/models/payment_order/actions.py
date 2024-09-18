from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentOrder

__all__ = [
    "PaymentOrderActions",
]


class PaymentOrderActions:
    def __init__(self, payment_order: PaymentOrder) -> None:
        self.payment_order = payment_order
