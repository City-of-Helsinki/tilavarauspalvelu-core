from __future__ import annotations

import pytest
from django.urls import reverse

from tests.factories import ReservationFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_statistics_export(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_1 = ReservationFactory.create()
    reservation_2 = ReservationFactory.create()

    url = reverse("reservation_statistics_export")
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2

    # Assume that the data per reservation statistic is correct from the exporter
    # -> Simply check the keys are what we expect
    assert list(data[0]) == [
        "id",
        "num_persons",
        "state",
        "reservation_type",
        "begin",
        "end",
        "buffer_time_before",
        "buffer_time_after",
        "reservation_handled_at",
        "reservation_confirmed_at",
        "reservation_created_at",
        "price",
        "price_net",
        "non_subsidised_price",
        "non_subsidised_price_net",
        "tax_percentage_value",
        "applying_for_free_of_charge",
        "reservee_id",
        "reservee_organisation_name",
        "reservee_address_zip",
        "reservee_is_unregistered_association",
        "reservee_language",
        "reservee_type",
        "access_type",
        "access_code_generated_at",
        "primary_reservation_unit",
        "primary_reservation_unit_name",
        "primary_unit_tprek_id",
        "primary_unit_name",
        "deny_reason",
        "deny_reason_text",
        "cancel_reason",
        "cancel_reason_text",
        "purpose",
        "purpose_name",
        "home_city",
        "home_city_name",
        "home_city_municipality_code",
        "age_group",
        "age_group_name",
        "ability_group",
        "ability_group_name",
        "reservation",
        "updated_at",
        "priority",
        "priority_name",
        "duration_minutes",
        "is_subsidised",
        "is_recurring",
        "recurrence_begin_date",
        "recurrence_end_date",
        "recurrence_uuid",
        "reservation_uuid",
        "reservee_uuid",
        "reservee_used_ad_login",
        "is_applied",
    ]
    assert data[0]["reservation"] == reservation_1.pk
    assert data[1]["reservation"] == reservation_2.pk


def test_reservation_unit_export__missing_auth(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()
    ReservationFactory.create()

    url = reverse("reservation_statistics_export")
    response = api_client.get(url)

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservation statistics."


def test_reservation_unit_export__incorrect_auth(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()
    ReservationFactory.create()

    settings.EXPORT_AUTHORIZATION_TOKEN = "CORRECT_TOKEN"

    url = reverse("reservation_statistics_export")
    response = api_client.get(url, headers={"Authorization": "INCORRECT_TOKEN"})

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservation statistics."
