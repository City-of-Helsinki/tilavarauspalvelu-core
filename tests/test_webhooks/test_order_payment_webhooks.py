import uuid
from unittest import mock

import pytest
from django.urls import reverse

from merchants.models import OrderStatus
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from reservations.choices import ReservationStateChoice
from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.test_webhooks.helpers import mock_order_payment_api

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_order_payment_webhook__success(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        status=OrderStatus.DRAFT,
        payment_id=None,
        processed_at=None,
        reservation=reservation,
    )

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order payment completed successfully"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID
    assert payment_order.payment_id is not None
    assert payment_order.processed_at is not None

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_order_payment_webhook__success__no_reservation(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        status=OrderStatus.DRAFT,
        payment_id=None,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order payment completed successfully"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID
    assert payment_order.payment_id is not None
    assert payment_order.processed_at is not None


@pytest.mark.parametrize("status", [OrderStatus.PAID, OrderStatus.PAID_MANUALLY, OrderStatus.REFUNDED])
def test_order_payment_webhook__no_action_needed(api_client, settings, status):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id, status=status)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order is already in a state where no updates are needed"}


@pytest.mark.parametrize("missing_field", ["orderId", "paymentId", "namespace", "eventType"])
def test_order_payment_webhook__missing_field(api_client, settings, missing_field):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    data.pop(missing_field)
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {missing_field: ["Tämä kenttä vaaditaan."]}


def test_order_payment_webhook__bad_namespace(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": "foo",
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"namespace": ["Invalid namespace: 'foo'"]}


def test_order_payment_webhook__bad_event_type(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "foo",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"eventType": ["Unsupported event type: 'foo'"]}


def test_order_payment_webhook__payment_order_not_found(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": f"Payment order order_id={order_id} not found"}


def test_order_payment_webhook__payment_fetch_failed(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock.patch("api.webhooks.views.get_payment", side_effect=GetPaymentError("Mock error")):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 500, response.data
    assert response.data == {"message": f"Checking payment for order '{order_id}' failed"}


def test_order_payment_webhook__no_payment_from_verkkokauppa(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock.patch("api.webhooks.views.get_payment", return_value=None):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": f"Payment '{order_id}' not found from verkkokauppa"}


def test_order_payment_webhook__invalid_payment_status(api_client, settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "paymentId": str(payment_id),
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    with mock_order_payment_api(order_id, payment_id, settings.VERKKOKAUPPA_NAMESPACE, status="foo"):
        response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"message": "Invalid payment status: 'foo'"}