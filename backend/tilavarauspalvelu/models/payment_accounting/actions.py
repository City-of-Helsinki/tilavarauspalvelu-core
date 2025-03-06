from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentAccounting

__all__ = [
    "PaymentAccountingActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentAccountingActions:
    payment_accounting: PaymentAccounting
