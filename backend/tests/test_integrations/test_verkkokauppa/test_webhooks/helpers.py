from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

from tilavarauspalvelu.integrations.verkkokauppa.payment.types import (
    Payment,
    RefundStatusResult,
    WebShopPaymentGateway,
    WebShopPaymentStatus,
    WebShopRefundStatus,
)
from utils.date_utils import DEFAULT_TIMEZONE


def get_mock_order_payment_api(
    remote_id: uuid.UUID,
    payment_id: uuid.UUID,
    status: str = "",
    payment_gateway: str = "",
) -> Payment:
    return Payment(
        payment_id=str(payment_id),
        namespace="tilanvaraus",
        order_id=remote_id,
        user_id=str(uuid.uuid4()),
        status=status or WebShopPaymentStatus.PAID_ONLINE.value,
        payment_method="creditcards",
        payment_type="order",
        total_excl_tax=Decimal(100),
        total=Decimal(124),
        tax_amount=Decimal(24),
        description=None,
        additional_info='{"payment_method": "creditcards"}',
        token=str(uuid.uuid4()),
        timestamp=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
        payment_method_label="Visa",
        payment_gateway=payment_gateway or WebShopPaymentGateway.PAYTRAIL.value,
    )


def get_mock_order_refund_api(
    order_id: uuid.UUID,
    refund_id: uuid.UUID,
    status: str = "",
) -> RefundStatusResult:
    return RefundStatusResult(
        order_id=order_id,
        refund_payment_id=str(refund_id),
        refund_transaction_id=uuid.uuid4(),
        namespace="tilanvaraus",
        status=status or WebShopRefundStatus.PAID_ONLINE.value,
        created_at=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
    )
