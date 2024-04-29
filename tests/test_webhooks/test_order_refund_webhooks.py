import uuid

import pytest
from django.urls import reverse

from merchants.models import OrderStatus
from merchants.verkkokauppa.payment.exceptions import GetRefundStatusError
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tests.factories import PaymentOrderFactory
from tests.helpers import patch_method
from tests.test_webhooks.helpers import get_mock_order_refund_api

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__success(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    payment_order = PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id)
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": "Order refund completed successfully"}

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.REFUNDED
    assert payment_order.processed_at is not None


@pytest.mark.parametrize(
    "status",
    [
        OrderStatus.DRAFT,
        OrderStatus.EXPIRED,
        OrderStatus.CANCELLED,
        OrderStatus.PAID_MANUALLY,
        OrderStatus.REFUNDED,
    ],
)
@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__no_action_needed(api_client, settings, status):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=status,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id)
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 200, response.data
    assert response.data == {"message": f"Order '{order_id}' is already in a state where no updates are needed"}


@pytest.mark.parametrize("missing_field", ["orderId", "refundId", "refundPaymentId", "namespace", "eventType"])
@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__missing_fields(api_client, settings, missing_field):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    data.pop(missing_field)
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id)
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {missing_field: ["This field is required."]}


@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__bad_namespace(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": "foo",
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id)
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"namespace": ["Invalid namespace: 'foo'"]}


@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__bad_event_type(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "foo",
    }
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id)
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"eventType": ["Unsupported event type: 'foo'"]}


@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__payment_order_not_found(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id)
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": f"Payment order {order_id=!s} & {refund_id=!s} not found"}


@patch_method(VerkkokauppaAPIClient.get_refund_status, side_effect=GetRefundStatusError("Mock error"))
def test_order_refund_webhook__refund_fetch_failed(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 500, response.data
    assert response.data == {"message": f"Checking order '{order_id}' failed"}


@patch_method(VerkkokauppaAPIClient.get_refund_status, return_value=None)
def test_order_refund_webhook__no_refund_from_verkkokauppa(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 404, response.data
    assert response.data == {"message": f"Refund for order '{order_id}' not found from verkkokauppa"}


@patch_method(VerkkokauppaAPIClient.get_refund_status)
def test_order_refund_webhook__invalid_refund_status(api_client, settings):
    order_id = uuid.uuid4()
    refund_id = uuid.uuid4()
    PaymentOrderFactory.create(
        remote_id=order_id,
        refund_id=refund_id,
        status=OrderStatus.PAID,
        processed_at=None,
    )

    data = {
        "orderId": str(order_id),
        "refundId": str(refund_id),
        "refundPaymentId": f"{uuid.uuid4()}_at_20231101-083021",
        "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        "eventType": "REFUND_PAID",
    }
    url = reverse("refund-list")

    VerkkokauppaAPIClient.get_refund_status.return_value = get_mock_order_refund_api(order_id, refund_id, status="foo")
    response = api_client.post(url, data=data, format="json")

    assert response.status_code == 400, response.data
    assert response.data == {"message": "Invalid refund status: 'foo'"}
