from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from tests.factories import (
    ApplicationSectionFactory,
    PaymentOrderFactory,
    ReservationFactory,
    ReservationUnitAccessTypeFactory,
    ReservationUnitFactory,
    ReservationUnitImageFactory,
    ReservationUnitOptionFactory,
    ReservationUnitPricingFactory,
    TaxPercentageFactory,
    UserFactory,
)

if TYPE_CHECKING:
    from django.test import Client

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def count_queries(client: Client, url: str) -> int:
    # The first request fills caches, such as the content type cache, so it runs more queries.
    client.get(url)

    with CaptureQueriesContext(connection) as context:
        response = client.get(url)

    assert response.status_code == 200
    return len(context.captured_queries)


# ── List pages ──


def test_admin_query_counts__reservation_list__same_for_more_reservations(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    ReservationFactory.create(reservation_unit=ReservationUnitFactory.create())
    url = reverse("admin:tilavarauspalvelu_reservation_changelist")
    query_count = count_queries(api_client, url)

    ReservationFactory.create_batch(3, reservation_unit=ReservationUnitFactory.create())
    ReservationFactory.create(reservation_unit=ReservationUnitFactory.create())

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__payment_order_list__same_for_more_payment_orders(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    PaymentOrderFactory.create(reservation=ReservationFactory.create(reservation_unit=ReservationUnitFactory.create()))
    url = reverse("admin:tilavarauspalvelu_paymentorder_changelist")
    query_count = count_queries(api_client, url)

    PaymentOrderFactory.create(reservation=ReservationFactory.create(reservation_unit=ReservationUnitFactory.create()))
    PaymentOrderFactory.create(reservation=ReservationFactory.create(reservation_unit=ReservationUnitFactory.create()))

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__reservation_unit_access_type_list__same_for_more_access_types(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    ReservationUnitAccessTypeFactory.create(reservation_unit=ReservationUnitFactory.create())
    url = reverse("admin:tilavarauspalvelu_reservationunitaccesstype_changelist")
    query_count = count_queries(api_client, url)

    ReservationUnitAccessTypeFactory.create(reservation_unit=ReservationUnitFactory.create())
    ReservationUnitAccessTypeFactory.create(reservation_unit=ReservationUnitFactory.create())

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__reservation_unit_option_list__same_for_more_options(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    ReservationUnitOptionFactory.create(
        reservation_unit=ReservationUnitFactory.create(),
        application_section=ApplicationSectionFactory.create(),
    )
    url = reverse("admin:tilavarauspalvelu_reservationunitoption_changelist")
    query_count = count_queries(api_client, url)

    ReservationUnitOptionFactory.create(
        reservation_unit=ReservationUnitFactory.create(),
        application_section=ApplicationSectionFactory.create(),
    )
    ReservationUnitOptionFactory.create(
        reservation_unit=ReservationUnitFactory.create(),
        application_section=ApplicationSectionFactory.create(),
    )

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__reservation_unit_pricing_list__same_for_more_pricings(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    ReservationUnitPricingFactory.create(tax_percentage=TaxPercentageFactory.create())
    url = reverse("admin:tilavarauspalvelu_reservationunitpricing_changelist")
    query_count = count_queries(api_client, url)

    ReservationUnitPricingFactory.create(tax_percentage=TaxPercentageFactory.create())
    ReservationUnitPricingFactory.create(tax_percentage=TaxPercentageFactory.create())

    assert count_queries(api_client, url) == query_count


# ── Change pages ──


def test_admin_query_counts__reservation_unit_pricing_change__same_for_more_reservation_units(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    pricing = ReservationUnitPricingFactory.create(tax_percentage=TaxPercentageFactory.create())
    url = reverse("admin:tilavarauspalvelu_reservationunitpricing_change", args=[pricing.pk])
    query_count = count_queries(api_client, url)

    ReservationUnitFactory.create_batch(3)

    assert count_queries(api_client, url) == query_count


def test_admin_query_counts__reservation_unit_image_change__same_for_more_reservation_units(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    image = ReservationUnitImageFactory.create(reservation_unit=ReservationUnitFactory.create())
    url = reverse("admin:tilavarauspalvelu_reservationunitimage_change", args=[image.pk])
    query_count = count_queries(api_client, url)

    ReservationUnitFactory.create_batch(3)

    assert count_queries(api_client, url) == query_count
