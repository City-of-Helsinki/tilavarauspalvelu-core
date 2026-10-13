from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from tests.factories import ReservationUnitFactory, UserFactory

if TYPE_CHECKING:
    from django.test import Client

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


@dataclasses.dataclass(frozen=True, slots=True)
class AutocompleteResult:
    labels: list[str]
    query_count: int


def autocomplete(client: Client, *, model_name: str, field_name: str) -> AutocompleteResult:
    url = reverse("admin:autocomplete")
    data = {"app_label": "tilavarauspalvelu", "model_name": model_name, "field_name": field_name, "term": ""}

    with CaptureQueriesContext(connection) as context:
        response = client.get(url, data=data)

    assert response.status_code == 200

    labels = [result["text"] for result in response.json()["results"]]
    return AutocompleteResult(labels=labels, query_count=len(context.captured_queries))


# ── Search results ──


def test_admin_autocomplete__reservation_units__labels_include_unit_without_extra_queries(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    ReservationUnitFactory.create(name="Sauna", unit__name="Uimahalli")
    result = autocomplete(api_client, model_name="reservationunitpricing", field_name="reservation_unit")

    assert result.labels == ["Sauna, Uimahalli"]

    ReservationUnitFactory.create_batch(3)
    more_result = autocomplete(api_client, model_name="reservationunitpricing", field_name="reservation_unit")

    assert len(more_result.labels) == 4
    assert more_result.query_count == result.query_count
