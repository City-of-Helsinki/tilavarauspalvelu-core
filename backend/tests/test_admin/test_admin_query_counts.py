from __future__ import annotations

import pytest
from django.urls import reverse

from tests.factories import (
    OriginHaukiResourceFactory,
    PaymentOrderFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)
from tests.test_admin.helpers import count_queries

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── List pages ──


def test_admin_query_counts__payment_order_list__same_for_more_payment_orders(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    PaymentOrderFactory.create(reservation=ReservationFactory.create(reservation_unit=ReservationUnitFactory.create()))
    url = reverse("admin:tilavarauspalvelu_paymentorder_changelist")
    query_count = count_queries(api_client, url)

    PaymentOrderFactory.create(reservation=ReservationFactory.create(reservation_unit=ReservationUnitFactory.create()))
    PaymentOrderFactory.create(reservation=ReservationFactory.create(reservation_unit=ReservationUnitFactory.create()))

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__space_list__same_for_more_spaces(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    SpaceFactory.create(parent=SpaceFactory.create())
    url = reverse("admin:tilavarauspalvelu_space_changelist")
    query_count = count_queries(api_client, url)

    SpaceFactory.create(parent=SpaceFactory.create())
    SpaceFactory.create(parent=SpaceFactory.create())

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__origin_hauki_resource_list__same_for_more_resources(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    ReservationUnitFactory.create(origin_hauki_resource=OriginHaukiResourceFactory.create())
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_changelist")
    query_count = count_queries(api_client, url)

    ReservationUnitFactory.create(origin_hauki_resource=OriginHaukiResourceFactory.create())
    ReservationUnitFactory.create(origin_hauki_resource=OriginHaukiResourceFactory.create())

    assert count_queries(api_client, url) == query_count
