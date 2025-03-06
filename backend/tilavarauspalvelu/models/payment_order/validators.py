from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder


__all__ = [
    "PaymentOrderValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentOrderValidator:
    payment_order: PaymentOrder
