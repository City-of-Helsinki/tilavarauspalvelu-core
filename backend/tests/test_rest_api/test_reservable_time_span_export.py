from __future__ import annotations

import pytest
from django.urls import reverse

from utils.date_utils import local_datetime

from tests.factories import ReservableTimeSpanFactory, ReservationUnitFactory, UnitFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservable_time_spans_export(api_client, settings):
    reservable_time_span_1 = ReservableTimeSpanFactory.create(
        resource__id=1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    reservable_time_span_2 = ReservableTimeSpanFactory.create(
        resource__id=2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export")
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2

    # Assume that the data per reservable time span is correct from the exporter
    # -> Simply check the keys are what we expect
    assert list(data[0]) == [
        "end_datetime",
        "resource",
        "start_datetime",
    ]
    assert data[0]["resource"] == reservable_time_span_1.resource.id
    assert data[1]["resource"] == reservable_time_span_2.resource.id


def test_reservable_time_spans_export__missing_auth(api_client):
    ReservableTimeSpanFactory.create(
        resource__id=1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource__id=2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )
    url = reverse("reservable_time_spans_export")
    response = api_client.get(url)

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservable time spans."


def test_reservable_time_spans_export__incorrect_auth(api_client, settings):
    settings.EXPORT_AUTHORIZATION_TOKEN = "CORRECT_TOKEN"

    ReservableTimeSpanFactory.create(
        resource__id=1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource__id=2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )
    url = reverse("reservable_time_spans_export")
    response = api_client.get(url, headers={"Authorization": "INCORRECT_TOKEN"})

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservable time spans."


def test_reservable_time_spans_export__only_one(api_client, settings):
    reservation_unit_1 = ReservationUnitFactory.create(origin_hauki_resource__id=1)
    reservation_unit_2 = ReservationUnitFactory.create(origin_hauki_resource__id=2)

    resource_1 = reservation_unit_1.origin_hauki_resource
    resource_2 = reservation_unit_2.origin_hauki_resource

    ReservableTimeSpanFactory.create(
        resource=resource_1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource=resource_2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export") + f"?only={reservation_unit_1.id}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["resource"] == resource_1.id


def test_reservable_time_spans_export__only_two(api_client, settings):
    reservation_unit_1 = ReservationUnitFactory.create(origin_hauki_resource__id=1)
    reservation_unit_2 = ReservationUnitFactory.create(origin_hauki_resource__id=2)

    resource_1 = reservation_unit_1.origin_hauki_resource
    resource_2 = reservation_unit_2.origin_hauki_resource

    ReservableTimeSpanFactory.create(
        resource=resource_1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource=resource_2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export") + f"?only={reservation_unit_1.id},{reservation_unit_2.id}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 2
    assert data[0]["resource"] == resource_1.id
    assert data[1]["resource"] == resource_2.id


def test_reservable_time_spans_export__tprek_id(api_client, settings):
    unit_1 = UnitFactory.create(tprek_id="1")
    unit_2 = UnitFactory.create(tprek_id="2")

    reservation_unit_1 = ReservationUnitFactory.create(origin_hauki_resource__id=1, unit=unit_1)
    reservation_unit_2 = ReservationUnitFactory.create(origin_hauki_resource__id=2, unit=unit_2)

    resource_1 = reservation_unit_1.origin_hauki_resource
    resource_2 = reservation_unit_2.origin_hauki_resource

    ReservableTimeSpanFactory.create(
        resource=resource_1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource=resource_2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export") + f"?tprek_id={unit_1.tprek_id}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["resource"] == resource_1.id


def test_reservable_time_spans_export__hauki_resource(api_client, settings):
    reservable_time_span = ReservableTimeSpanFactory.create(
        resource__id=1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource__id=2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export") + f"?hauki_resource={reservable_time_span.resource.id}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["resource"] == reservable_time_span.resource.id


def test_reservable_time_spans_export__after(api_client, settings):
    ReservableTimeSpanFactory.create(
        resource__id=1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    reservable_time_span = ReservableTimeSpanFactory.create(
        resource__id=2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export") + "?after=2024-01-02T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["resource"] == reservable_time_span.resource.id


def test_reservable_time_spans_export__before(api_client, settings):
    reservable_time_span = ReservableTimeSpanFactory.create(
        resource__id=1,
        start_datetime=local_datetime(2024, 1, 1, 12),
        end_datetime=local_datetime(2024, 1, 1, 13),
    )
    ReservableTimeSpanFactory.create(
        resource__id=2,
        start_datetime=local_datetime(2024, 1, 2, 13),
        end_datetime=local_datetime(2024, 1, 2, 14),
    )

    url = reverse("reservable_time_spans_export") + "?before=2024-01-02T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["resource"] == reservable_time_span.resource.id
