import uuid

import pytest
from django.urls import reverse

from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.enums import OrderStatus
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.enums import ReservationStateChoice
from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method
from tests.test_external_services.test_verkkokauppa.test_webhooks.helpers import get_mock_order_payment_api
from utils.sentry import SentryLogger

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
def test_order_payment_webhook__success(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        status=OrderStatus.DRAFT,
        payment_id="",
        processed_at=None,
        reservation=reservation,
    )

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order payment completed successfully"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID
    assert payment_order.payment_id
    assert payment_order.processed_at is not None

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
def test_order_payment_webhook__success__no_reservation(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        status=OrderStatus.DRAFT,
        payment_id="",
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order payment completed successfully"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID
    assert payment_order.payment_id
    assert payment_order.processed_at is not None


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
@pytest.mark.parametrize("status", [OrderStatus.PAID, OrderStatus.PAID_MANUALLY, OrderStatus.REFUNDED])
def test_order_payment_webhook__no_action_needed(api_client, settings, status):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id, status=status)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order is already in a state where no updates are needed"}


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
@patch_method(SentryLogger.log_message)
@pytest.mark.parametrize("missing_field", ["orderId", "paymentId", "namespace", "eventType"])
def test_order_payment_webhook__missing_field(api_client, settings, missing_field):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    data.pop(missing_field)
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {missing_field: ["This field is required."]}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
@patch_method(SentryLogger.log_message)
def test_order_payment_webhook__bad_namespace(api_client):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": "foo",
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"namespace": ["Invalid namespace: 'foo'"]}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
@patch_method(SentryLogger.log_message)
def test_order_payment_webhook__bad_event_type(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    PaymentOrderFactory.create(remote_id=order_id)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "foo",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"eventType": ["Unsupported event type: 'foo'"]}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
@patch_method(SentryLogger.log_message)
def test_order_payment_webhook__payment_order_not_found(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id)

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": f"Payment order '{order_id}' not found"}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(SentryLogger.log_message)
def test_order_payment_webhook__payment_fetch_failed(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.side_effect = GetPaymentError("Mock error")
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 500, response.data
    assert response.data == {"message": f"Checking payment for order '{order_id}' failed"}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(SentryLogger.log_message)
def test_order_payment_webhook__no_payment_from_verkkokauppa(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = None
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": f"Payment '{order_id}' not found from verkkokauppa"}

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
@patch_method(SentryLogger.log_message)
def test_order_payment_webhook__invalid_payment_status(api_client, settings):
    order_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    PaymentOrderFactory.create(remote_id=order_id, status=OrderStatus.DRAFT)

    data = {
        "orderId": str(order_id),
        "paymentId": f"{payment_id}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "PAYMENT_PAID",
    }
    url = reverse("payment-list")

    VerkkokauppaAPIClient.get_payment.return_value = get_mock_order_payment_api(order_id, payment_id, status="foo")

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"message": "Invalid payment status: 'foo'"}

    assert SentryLogger.log_message.call_count == 1
