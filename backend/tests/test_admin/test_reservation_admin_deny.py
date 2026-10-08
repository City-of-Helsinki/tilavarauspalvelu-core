from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from django.contrib.admin import helpers
from django.urls import reverse

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentOrder, Reservation
from utils.date_utils import local_datetime

from tests.factories import (
    OrderFactory,
    PaymentOrderFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    UserFactory,
)
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def create_invoiced_reservation(*, begins_at: datetime.datetime) -> Reservation:
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        begins_at=begins_at,
        ends_at=begins_at + datetime.timedelta(hours=1),
        price=Decimal("10.00"),
    )
    PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        reservation_user_uuid=uuid.uuid4(),
        status=OrderStatus.PAID_BY_INVOICE,
    )
    return reservation


# ── Deny with refund ──


def test_reservation_admin__deny_with_refund__confirmation_page__future_invoice_is_cancellable(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation = create_invoiced_reservation(begins_at=local_datetime() + datetime.timedelta(days=7))

    url = reverse("admin:tilavarauspalvelu_reservation_changelist")
    data = {
        "action": "deny_reservations_with_refund",
        helpers.ACTION_CHECKBOX_NAME: [reservation.pk],
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert response.context_data["queryset_cancellable_reservation_count"] == 1


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation_admin__deny_with_refund__future_invoice_is_cancelled(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation = create_invoiced_reservation(begins_at=local_datetime() + datetime.timedelta(days=7))
    deny_reason = ReservationDenyReasonFactory.create()

    VerkkokauppaAPIClient.cancel_order.return_value = OrderFactory.create(status=WebShopOrderStatus.CANCELLED)

    url = reverse("admin:tilavarauspalvelu_reservation_changelist")
    data = {
        "action": "deny_reservations_with_refund",
        helpers.ACTION_CHECKBOX_NAME: [reservation.pk],
        "confirmed": "true",
        "deny_reason": deny_reason.pk,
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302

    reservation = Reservation.objects.get(pk=reservation.pk)
    assert reservation.state == ReservationStateChoice.DENIED

    payment_order = PaymentOrder.objects.get(reservation=reservation)
    assert payment_order.status == OrderStatus.CANCELLED

    assert VerkkokauppaAPIClient.cancel_order.call_count == 1
