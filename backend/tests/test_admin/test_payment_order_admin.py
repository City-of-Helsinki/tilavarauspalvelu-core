from __future__ import annotations

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import PaymentOrder

from tests.factories import PaymentOrderFactory, ReservationFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Change page ──


def test_payment_order_admin__change_page__shows_payment_order_without_save(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    payment_order = PaymentOrderFactory.create(reservation=ReservationFactory.create(), status=OrderStatus.DRAFT)

    url = reverse("admin:tilavarauspalvelu_paymentorder_change", args=[payment_order.pk])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.context["has_change_permission"] is False


def test_payment_order_admin__change_page__does_not_save_changes(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    payment_order = PaymentOrderFactory.create(reservation=ReservationFactory.create(), status=OrderStatus.DRAFT)

    url = reverse("admin:tilavarauspalvelu_paymentorder_change", args=[payment_order.pk])
    response = api_client.post(url, data={"status": OrderStatus.PAID.value})

    assert response.status_code == 403

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.DRAFT


# ── Add and delete ──


def test_payment_order_admin__add_page__forbidden(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    response = api_client.get(reverse("admin:tilavarauspalvelu_paymentorder_add"))

    assert response.status_code == 403


def test_payment_order_admin__delete_page__forbidden(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    payment_order = PaymentOrderFactory.create(reservation=ReservationFactory.create())

    url = reverse("admin:tilavarauspalvelu_paymentorder_delete", args=[payment_order.pk])
    response = api_client.post(url, data={"post": "yes"})

    assert response.status_code == 403
    assert PaymentOrder.objects.filter(pk=payment_order.pk).exists()
