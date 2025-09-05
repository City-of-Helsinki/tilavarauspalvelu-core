from __future__ import annotations

import freezegun
import pytest

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import PaymentOrder

from .helpers import ORDER_QUERY, get_order

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query(graphql):
    order = get_order()

    graphql.login_with_superuser()
    response = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response.has_errors is False

    assert response.results == {
        "orderUuid": str(order.remote_id),
        "status": str(order.status),
        "paymentType": str(order.payment_type),
        "receiptUrl": order.receipt_url,
        "checkoutUrl": order.checkout_url,
        "refundUuid": str(order.refund_id),
        "expiresInMinutes": 5,
    }


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__checkout_url_not_visible_when_expired(graphql):
    order = get_order()

    graphql.login_with_superuser()
    response_1 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_1.has_errors is False
    assert response_1.results["checkoutUrl"] == order.checkout_url
    assert response_1.results["expiresInMinutes"] == 5

    with freezegun.freeze_time("2021-01-01T12:11:00Z"):
        response_2 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_2.has_errors is False
    assert response_2.results["checkoutUrl"] is None
    assert response_2.results["expiresInMinutes"] is None


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__checkout_url_not_visible_when_not_draft(graphql):
    order = get_order()

    graphql.login_with_superuser()
    response_1 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_1.has_errors is False
    assert response_1.results["checkoutUrl"] == order.checkout_url

    order.status = OrderStatus.CANCELLED
    order.save()

    response_2 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})
    assert response_2.has_errors is False
    assert response_2.results["checkoutUrl"] is None


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__expires_in_minutes_keeps_updating_based_on_current_time(graphql):
    order = get_order()

    graphql.login_with_superuser()
    response_1 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_1.has_errors is False
    assert response_1.results["expiresInMinutes"] == 5

    with freezegun.freeze_time("2021-01-01T12:04:00Z"):
        response_2 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_2.has_errors is False
    assert response_2.results["expiresInMinutes"] == 1

    with freezegun.freeze_time("2021-01-01T12:04:59Z"):
        response_3 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_3.has_errors is False
    assert response_3.results["expiresInMinutes"] == 0

    with freezegun.freeze_time("2021-01-01T12:05:00Z"):
        response_4 = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response_4.has_errors is False
    assert response_4.results["expiresInMinutes"] is None


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__reservation_is_deleted__nothing_returned(graphql):
    """Order's reservation is deleted, so order can't be found even by superuser."""
    order = get_order()
    order.reservation.delete()

    graphql.login_with_superuser()
    response = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response.has_errors is True
    assert response.error_message(0) == f"PaymentOrder '{order.remote_id}' does not exist."
    assert PaymentOrder.objects.filter(remote_id=order.remote_id).exists() is True  # Order still exists in DB
