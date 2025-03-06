from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentProduct


__all__ = [
    "PaymentProductValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentProductValidator:
    payment_product: PaymentProduct
