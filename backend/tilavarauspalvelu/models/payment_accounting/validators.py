from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentAccounting


__all__ = [
    "PaymentAccountingValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentAccountingValidator:
    payment_accounting: PaymentAccounting
