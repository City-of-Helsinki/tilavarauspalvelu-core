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

    def supports_invoicing(self) -> bool:
        return (
            bool(self.payment_accounting.product_invoicing_sales_org)
            and bool(self.payment_accounting.product_invoicing_sales_office)
            and bool(self.payment_accounting.product_invoicing_material)
            and bool(self.payment_accounting.product_invoicing_order_type)
        )
