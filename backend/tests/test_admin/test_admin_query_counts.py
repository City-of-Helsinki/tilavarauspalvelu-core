from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory

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
