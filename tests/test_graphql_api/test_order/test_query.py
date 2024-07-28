import freezegun
import pytest

from merchants.enums import OrderStatus
from tests.helpers import UserType

from .helpers import get_order, order_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query(graphql):
    order = get_order()

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = order_query(order_uuid=order.remote_id)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": str(order.status),
        "paymentType": str(order.payment_type),
        "receiptUrl": order.receipt_url,
        "checkoutUrl": order.checkout_url,
        "reservationPk": str(order.reservation.pk),
        "refundUuid": str(order.refund_id),
        "expiresInMinutes": 5,
    }


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__checkout_url_not_visible_when_expired(graphql):
    order = get_order()

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = order_query(order_uuid=order.remote_id)
    response_1 = graphql(query)

    assert response_1.has_errors is False
    assert response_1.first_query_object["checkoutUrl"] == order.checkout_url
    assert response_1.first_query_object["expiresInMinutes"] == 5

    with freezegun.freeze_time("2021-01-01T12:11:00Z"):
        response_2 = graphql(query)

    assert response_2.has_errors is False
    assert response_2.first_query_object["checkoutUrl"] is None
    assert response_2.first_query_object["expiresInMinutes"] is None


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__checkout_url_not_visible_when_not_draft(graphql):
    order = get_order()

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = order_query(order_uuid=order.remote_id)
    response_1 = graphql(query)

    assert response_1.has_errors is False
    assert response_1.first_query_object["checkoutUrl"] == order.checkout_url

    order.status = OrderStatus.CANCELLED
    order.save()

    response_2 = graphql(query)
    assert response_2.has_errors is False
    assert response_2.first_query_object["checkoutUrl"] is None


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_order__query__expires_in_minutes_keeps_updating_based_on_current_time(graphql):
    order = get_order()

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = order_query(order_uuid=order.remote_id)
    response_1 = graphql(query)

    assert response_1.has_errors is False
    assert response_1.first_query_object["expiresInMinutes"] == 5

    with freezegun.freeze_time("2021-01-01T12:04:00Z"):
        response_2 = graphql(query)

    assert response_2.has_errors is False
    assert response_2.first_query_object["expiresInMinutes"] == 1

    with freezegun.freeze_time("2021-01-01T12:04:59Z"):
        response_3 = graphql(query)

    assert response_3.has_errors is False
    assert response_3.first_query_object["expiresInMinutes"] == 0

    with freezegun.freeze_time("2021-01-01T12:05:00Z"):
        response_4 = graphql(query)

    assert response_4.has_errors is False
    assert response_4.first_query_object["expiresInMinutes"] is None
