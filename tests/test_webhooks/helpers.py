import uuid
from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal
from unittest import mock
from uuid import uuid4

from django.utils.timezone import get_default_timezone

from merchants.verkkokauppa.payment.types import Payment, PaymentStatus, RefundStatus, RefundStatusResult


@contextmanager
def mock_send_confirmation_email():
    with mock.patch("api.webhooks.views.send_confirmation_email"):
        yield


def get_mock_order_payment_api(remote_id: uuid.UUID, payment_id: uuid.UUID, status: str = "") -> Payment:
    return Payment(
        payment_id=str(payment_id),
        namespace="tilanvaraus",
        order_id=remote_id,
        user_id=str(uuid.uuid4()),
        status=status or PaymentStatus.PAID_ONLINE.value,
        payment_method="creditcards",
        payment_type="order",
        total_excl_tax=Decimal("100"),
        total=Decimal("124"),
        tax_amount=Decimal("24"),
        description=None,
        additional_info='{"payment_method": "creditcards"}',
        token=str(uuid.uuid4()),
        timestamp=datetime.now(tz=get_default_timezone()),
        payment_method_label="Visa",
    )


def get_mock_order_refund_api(order_id: uuid.UUID, refund_id: uuid.UUID, status: str = "") -> RefundStatusResult:
    return RefundStatusResult(
        order_id=order_id,
        refund_payment_id=str(refund_id),
        refund_transaction_id=uuid4(),
        namespace="tilanvaraus",
        status=status or RefundStatus.PAID_ONLINE.value,
        created_at=datetime.now(tz=get_default_timezone()),
    )
