from __future__ import annotations

import pytest
from django.urls import reverse

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
        "reservation_unit_id",
        "name",
        "name_fi",
        "name_en",
        "name_sv",
        "description",
        "description_fi",
        "description_en",
        "description_sv",
        "type",
        "terms_of_use",
        "terms_of_use_fi",
        "terms_of_use_en",
        "terms_of_use_sv",
        "service_specific_terms",
        "tprek_id",
        "unit",
        "contact_information",
        "is_this_in_draft_state",
        "publish_begins",
        "publish_ends",
        "spaces",
        "resources",
        "qualifiers",
        "payment_terms",
        "cancellation_terms",
        "pricing_terms",
        "cancellation_rule",
        "price_unit",
        "lowest_price",
        "highest_price",
        "tax_percentage",
        "reservation_begins",
        "reservation_ends",
        "reservation_metadata_set",
        "require_a_handling",
        "authentication",
        "reservation_kind",
        "payment_type",
        "can_apply_free_of_charge",
        "additional_instructions_for_pending_reservation_fi",
        "additional_instructions_for_pending_reservation_sv",
        "additional_instructions_for_pending_reservation_en",
        "additional_instructions_for_confirmed_reservation_fi",
        "additional_instructions_for_confirmed_reservation_sv",
        "additional_instructions_for_confirmed_reservation_en",
        "additional_instructions_for_cancelled_reservations_fi",
        "additional_instructions_for_cancelled_reservations_sv",
        "additional_instructions_for_cancelled_reservations_en",
        "maximum_reservation_duration",
        "minimum_reservation_duration",
        "maximum_number_of_persons",
        "minimum_number_of_persons",
        "surface_area",
        "buffer_time_before_reservation",
        "buffer_time_after_reservation",
        "hauki_resource_id",
        "reservation_start_interval",
        "maximum_number_of_days_before_reservations_can_be_made",
        "minimum_days_before_reservations_can_be_made",
        "maximum_number_of_active_reservations_per_user",
        "allow_reservations_without_opening_hours",
        "is_reservation_unit_archived",
        "purposes",
        "equipments",
        "state",
        "reservation_state",
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
    assert response.content.decode() == "'only' should be a comma separated list of reservation unit ids."
