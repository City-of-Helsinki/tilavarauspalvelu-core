from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PaymentProduct

__all__ = [
    "PaymentProductActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentProductActions:
    payment_product: PaymentProduct
