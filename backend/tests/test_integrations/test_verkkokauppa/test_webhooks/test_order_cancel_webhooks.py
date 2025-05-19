from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import GetOrderError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import Order, WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import PaymentOrderFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def _create_mock_order(order_id: uuid.UUID, status: WebShopOrderStatus = "") -> Order:
    return Order(
        order_id=order_id,
        namespace="tilanvaraus",
        user=str(uuid.uuid4()),
        created_at=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
        items=[],
        price_net=Decimal(100),
        price_vat=Decimal(24),
        price_total=Decimal(124),
        checkout_url="https://checkout.url",
        receipt_url="https://receipt.url",
        customer=None,
        status=status or WebShopOrderStatus.CANCELLED,
        subscription_id=None,
        type="order",
    )


@patch_method(VerkkokauppaAPIClient.get_order)
@pytest.mark.parametrize(
    "status",
    [
        OrderStatus.DRAFT,
        OrderStatus.EXPIRED,
        OrderStatus.PAID_BY_INVOICE,
        OrderStatus.PAID_MANUALLY,
    ],
)
def test_order_cancel_webhook__success(api_client, settings, status):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id)
    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        status=status,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order cancellation completed successfully"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED
    assert payment_order.processed_at is not None


@patch_method(VerkkokauppaAPIClient.get_order)
@pytest.mark.parametrize(
    "status",
    [
        OrderStatus.CANCELLED,
        OrderStatus.PAID,
        OrderStatus.REFUNDED,
    ],
)
def test_order_cancel_webhook__no_action_needed(api_client, settings, status):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id)
    PaymentOrderFactory.create(remote_id=order_id, status=status)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order is already in a state where no updates are needed"}


def test_order_cancel_webhook__pending_order(api_client, settings):
    order_id = uuid.uuid4()
    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(),
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Pending order remains payable until its due date"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PENDING


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
@pytest.mark.parametrize("missing_field", ["orderId", "namespace", "eventType"])
def test_order_cancel_webhook__missing_fields(api_client, settings, missing_field):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id)
    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    data.pop(missing_field)
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {missing_field: ["This field is required."]}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
def test_order_cancel_webhook__bad_namespace(api_client, settings):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id)
    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT, processed_at=None)

    data = {
        "orderId": str(order_id),
        "namespace": "foo",
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"namespace": ["Invalid namespace: 'foo'"]}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
def test_order_cancel_webhook__bad_event_type(api_client, settings):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id)
    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT, processed_at=None)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "foo",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"eventType": ["Unsupported event type: 'foo'"]}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
def test_order_cancel_webhook__payment_order_not_found(api_client, settings):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": "Payment order not found"}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
def test_order_cancel_webhook__order_fetch_failed(api_client, settings):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.side_effect = GetOrderError("Mock error")
    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT, processed_at=None)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 500, response.data
    assert response.data == {"message": "Could not get order from verkkokauppa"}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
def test_order_cancel_webhook__no_order_from_verkkokauppa(api_client, settings):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = None
    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT, processed_at=None)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": "Order not found from verkkokauppa"}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_order)
@patch_method(SentryLogger.log_message)
def test_order_cancel_webhook__invalid_order_status(api_client, settings):
    order_id = uuid.uuid4()
    VerkkokauppaAPIClient.get_order.return_value = _create_mock_order(order_id, status="foo")
    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT, processed_at=None)

    data = {
        "orderId": str(order_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "ORDER_CANCELLED",
    }
    response = api_client.post(reverse("order-list"), data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"message": "Payment order cannot be cancelled based webshop order status"}

    assert SentryLogger.log_message.call_count == 1
