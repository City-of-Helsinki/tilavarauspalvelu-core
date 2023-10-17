from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import get_default_timezone
from rest_framework.test import APIClient

from merchants.models import OrderStatus
from merchants.verkkokauppa.order.types import Order
from merchants.verkkokauppa.payment.types import Payment, RefundStatus, RefundStatusResult
from reservations.choices import ReservationStateChoice
from tests.factories import PaymentOrderFactory, ReservationFactory


class WebhookAPITestCaseBase(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user = get_user_model().objects.create(
            username="sonya_blade",
            first_name="Sonya",
            last_name="Blade",
            email="sonya.blade@earthrealm.com",
        )
        self.reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT, user=self.user)
        self.payment_order = PaymentOrderFactory.create(reservation=self.reservation, status=OrderStatus.DRAFT)
        self.verkkokauppa_payment = Payment(
            payment_id=uuid4(),
            namespace="tilanvaraus",
            order_id=self.payment_order.remote_id,
            user_id=uuid4(),
            status="payment_paid_online",
            payment_method="creditcards",
            payment_type="order",
            total_excl_tax=Decimal("100"),
            total=Decimal("124"),
            tax_amount=Decimal("24"),
            description=None,
            additional_info='{"payment_method": creditcards}',
            token=uuid4(),
            timestamp=datetime.now(tz=get_default_timezone()),
            payment_method_label="Visa",
        )
        self.verkkokauppa_order = Order(
            order_id=uuid4(),
            namespace="tilanvaraus",
            user=self.user,
            created_at=datetime.now(tz=get_default_timezone()),
            items=[],
            price_net=Decimal("100"),
            price_vat=Decimal("24"),
            price_total=Decimal("124"),
            checkout_url="https://checkout.url",
            receipt_url="https://receipt.url",
            customer=None,
            status="cancelled",
            subscription_id=None,
            type="order",
        )
        self.refund_status = RefundStatusResult(
            order_id=uuid4(),
            refund_payment_id=str(uuid4()),
            refund_transaction_id=uuid4(),
            namespace="tilanvaraus",
            status=RefundStatus.PAID_ONLINE.value,
            created_at=datetime.now(tz=get_default_timezone()),
        )
