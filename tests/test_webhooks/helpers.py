import uuid
from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal
from unittest import mock
from uuid import uuid4

from django.utils.timezone import get_default_timezone

from merchants.verkkokauppa.order.types import Order
from merchants.verkkokauppa.payment.types import Payment, PaymentStatus, RefundStatus, RefundStatusResult


@contextmanager
def mock_order_payment_api(remote_id: uuid.UUID, payment_id: uuid.UUID, namespace: str, status: str = ""):
    order = Payment(
        payment_id=str(payment_id),
        namespace=namespace,
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
    with (
        mock.patch("api.webhooks.views.get_payment", return_value=order),
        mock.patch("api.webhooks.views.send_confirmation_email"),
    ):
        yield


@contextmanager
def mock_order_cancel_api(order_id: uuid.UUID, namespace: str, status: str = ""):
    order = Order(
        order_id=order_id,
        namespace=namespace,
        user=str(uuid.uuid4()),
        created_at=datetime.now(tz=get_default_timezone()),
        items=[],
        price_net=Decimal("100"),
        price_vat=Decimal("24"),
        price_total=Decimal("124"),
        checkout_url="https://checkout.url",
        receipt_url="https://receipt.url",
        customer=None,
        status=status or "cancelled",
        subscription_id=None,
        type="order",
    )
    with mock.patch("api.webhooks.views.get_order", return_value=order):
        yield


@contextmanager
def mock_order_refund_api(order_id: uuid.UUID, refund_id: uuid.UUID, namespace: str, status: str = ""):
    order = RefundStatusResult(
        order_id=order_id,
        refund_payment_id=str(refund_id),
        refund_transaction_id=uuid4(),
        namespace=namespace,
        status=status or RefundStatus.PAID_ONLINE.value,
        created_at=datetime.now(tz=get_default_timezone()),
    )
    with mock.patch("api.webhooks.views.get_refund_status", return_value=order):
        yield
