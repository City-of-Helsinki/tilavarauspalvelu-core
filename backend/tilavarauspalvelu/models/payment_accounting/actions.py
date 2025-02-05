from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentAccounting

__all__ = [
    "PaymentAccountingActions",
]


class PaymentAccountingActions:
    def __init__(self, payment_accounting: PaymentAccounting) -> None:
        self.payment_accounting = payment_accounting
