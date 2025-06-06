from __future__ import annotations

import freezegun
import pytest
from django.urls import reverse

from utils.date_utils import local_datetime

from tests.factories import ReservationUnitFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_export(api_client, settings):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    url = reverse("reservation_unit_export")
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2

    # Assume that the data per reservation unit is correct from the exporter
    # -> Simply check the keys are what we expect
    assert list(data[0]) == [
        "additional_instructions_for_cancelled_reservations_en",
        "additional_instructions_for_cancelled_reservations_fi",
        "additional_instructions_for_cancelled_reservations_sv",
        "additional_instructions_for_confirmed_reservation_en",
        "additional_instructions_for_confirmed_reservation_fi",
        "additional_instructions_for_confirmed_reservation_sv",
        "additional_instructions_for_pending_reservation_en",
        "additional_instructions_for_pending_reservation_fi",
        "additional_instructions_for_pending_reservation_sv",
        "allow_reservations_without_opening_hours",
        "authentication",
        "buffer_time_after_reservation",
        "buffer_time_before_reservation",
        "can_apply_free_of_charge",
        "cancellation_rule",
        "cancellation_terms",
        "contact_information",
        "description",
        "description_en",
        "description_fi",
        "description_sv",
        "equipments",
        "hauki_resource_id",
        "highest_price",
        "is_reservation_unit_archived",
        "is_this_in_draft_state",
        "lowest_price",
        "maximum_number_of_active_reservations_per_user",
        "maximum_number_of_days_before_reservations_can_be_made",
        "maximum_number_of_persons",
        "maximum_reservation_duration",
        "minimum_days_before_reservations_can_be_made",
        "minimum_number_of_persons",
        "minimum_reservation_duration",
        "name",
        "name_en",
        "name_fi",
        "name_sv",
        "notes_when_applying",
        "notes_when_applying_en",
        "notes_when_applying_fi",
        "notes_when_applying_sv",
        "payment_terms",
        "payment_type",
        "price_unit",
        "pricing_terms",
        "publish_begins_at",
        "publish_ends_at",
        "purposes",
        "require_a_handling",
        "reservation_begins_at",
        "reservation_ends_at",
        "reservation_kind",
        "reservation_metadata_set",
        "reservation_start_interval",
        "reservation_state",
        "reservation_unit_id",
        "resources",
        "service_specific_terms",
        "spaces",
        "state",
        "surface_area",
        "tax_percentage",
        "tprek_id",
        "type",
        "unit",
        "updated_at",
    ]
    assert data[0]["reservation_unit_id"] == reservation_unit_1.pk
    assert data[1]["reservation_unit_id"] == reservation_unit_2.pk


def test_reservation_unit_export__missing_auth(api_client):
    ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    url = reverse("reservation_unit_export")
    response = api_client.get(url)

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservation units."


def test_reservation_unit_export__incorrect_auth(api_client, settings):
    ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    settings.EXPORT_AUTHORIZATION_TOKEN = "CORRECT_TOKEN"

    url = reverse("reservation_unit_export")
    response = api_client.get(url, headers={"Authorization": "INCORRECT_TOKEN"})

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservation units."


def test_reservation_unit_export__only_one(api_client, settings):
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + f"?only={reservation_unit.pk}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_unit_id"] == reservation_unit.pk


def test_reservation_unit_export__only_two(api_client, settings):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + f"?only={reservation_unit_1.pk},{reservation_unit_2.pk}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert data[0]["reservation_unit_id"] == reservation_unit_1.pk
    assert data[1]["reservation_unit_id"] == reservation_unit_2.pk


def test_reservation_unit_export__only_incorrect(api_client, settings):
    ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?only=foo"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 400
    assert response.json() == {
        "detail": "'only' should be a comma separated list of integers.",
        "code": "",
    }


def test_reservation_unit_export__tprek_id(api_client, settings):
    reservation_unit = ReservationUnitFactory.create(unit__tprek_id="1")
    ReservationUnitFactory.create(unit__tprek_id="2")

    url = reverse("reservation_unit_export") + "?tprek_id=1"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_unit_id"] == reservation_unit.pk


def test_reservation_unit_export__start(api_client, settings):
    ReservationUnitFactory.create()
    reservation_unit = ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?start=1"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_unit_id"] == reservation_unit.pk


def test_reservation_unit_export__stop(api_client, settings):
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?stop=1"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_unit_id"] == reservation_unit.pk


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_unit_export__updated_after(api_client, settings):
    reservation_unit = ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?updated_after=2024-01-01T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_unit_id"] == reservation_unit.pk


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_unit_export__updated_after__not_in_range(api_client, settings):
    ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?updated_after=2024-01-02T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 0


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_unit_export__updated_before(api_client, settings):
    reservation_unit = ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?updated_before=2024-01-02T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_unit_id"] == reservation_unit.pk


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_unit_export__updated_before__not_in_range(api_client, settings):
    ReservationUnitFactory.create()

    url = reverse("reservation_unit_export") + "?updated_before=2024-01-01T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 0
