from __future__ import annotations

import datetime

import freezegun
import pytest
from django.urls import reverse

from utils.date_utils import local_datetime

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
        "ability_group",  # Removed from series model
        "ability_group_name",  # Removed from series model
        "access_code_generated_at",
        "access_type",
        "age_group",
        "age_group_name",
        "applying_for_free_of_charge",
        "begin",
        "buffer_time_after",
        "buffer_time_before",
        "cancel_reason",
        "cancel_reason_text",
        "deny_reason",
        "deny_reason_text",
        "duration_minutes",
        "end",
        "home_city",
        "home_city_municipality_code",
        "home_city_name",
        "is_applied",
        "is_recurring",
        "is_subsidised",
        "non_subsidised_price",
        "non_subsidised_price_net",
        "num_persons",
        "price",
        "price_net",
        "primary_reservation_unit",
        "primary_reservation_unit_name",
        "primary_unit_name",
        "primary_unit_tprek_id",
        "priority",
        "priority_name",
        "purpose",
        "purpose_name",
        "recurrence_begin_date",
        "recurrence_end_date",
        "recurrence_uuid",
        "reservation_confirmed_at",
        "reservation_created_at",
        "reservation_handled_at",
        "reservation_type",
        "reservation_uuid",
        "reservee_address_zip",
        "reservee_id",
        "reservee_is_unregistered_association",
        "reservee_language",
        "reservee_organisation_name",
        "reservee_type",
        "reservee_used_ad_login",
        "reservee_uuid",
        "state",
        "tax_percentage_value",
        "updated_at",
    ]
    assert data[0]["reservation_uuid"] == str(reservation_1.ext_uuid)
    assert data[1]["reservation_uuid"] == str(reservation_2.ext_uuid)


def test_reservation_statistics_export__missing_auth(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()
    ReservationFactory.create()

    url = reverse("reservation_statistics_export")
    response = api_client.get(url)

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservation statistics."


def test_reservation_statistics_export__incorrect_auth(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()
    ReservationFactory.create()

    settings.EXPORT_AUTHORIZATION_TOKEN = "CORRECT_TOKEN"

    url = reverse("reservation_statistics_export")
    response = api_client.get(url, headers={"Authorization": "INCORRECT_TOKEN"})

    assert response.status_code == 403
    assert response.content.decode() == "Not authorized to export reservation statistics."


def test_reservation_statistics_export__only_one(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create()
    ReservationFactory.create()

    url = reverse("reservation_statistics_export") + f"?only={reservation.ext_uuid}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


def test_reservation_statistics_export__only_two(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_1 = ReservationFactory.create()
    reservation_2 = ReservationFactory.create()

    url = reverse("reservation_statistics_export") + f"?only={reservation_1.ext_uuid},{reservation_2.ext_uuid}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 2
    assert data[0]["reservation_uuid"] == str(reservation_1.ext_uuid)
    assert data[1]["reservation_uuid"] == str(reservation_2.ext_uuid)


def test_reservation_statistics_export__tprek_id(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create(reservation_units__unit__tprek_id="1")
    ReservationFactory.create(reservation_units__unit__tprek_id="2")

    url = reverse("reservation_statistics_export") + "?tprek_id=1"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


def test_reservation_statistics_export__begins_after(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    begin_1 = local_datetime(2022, 1, 2, 12)
    begin_2 = begin_1 - datetime.timedelta(days=1)

    reservation = ReservationFactory.create(begins_at=begin_1)
    ReservationFactory.create(begins_at=begin_2)

    url = reverse("reservation_statistics_export") + f"?begins_after={begin_1.isoformat()}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


def test_reservation_statistics_export__begins_before(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    begin_1 = local_datetime(2022, 1, 2, 12)
    begin_2 = begin_1 - datetime.timedelta(days=1)

    ReservationFactory.create(begins_at=begin_1)
    reservation = ReservationFactory.create(begins_at=begin_2)

    url = reverse("reservation_statistics_export") + f"?begins_before={begin_1.isoformat()}"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


def test_reservation_statistics_export__start(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()
    reservation = ReservationFactory.create()

    url = reverse("reservation_statistics_export") + "?start=1"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


def test_reservation_statistics_export__stop(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create()
    ReservationFactory.create()

    url = reverse("reservation_statistics_export") + "?stop=1"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_statistics_export__updated_after(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create()

    url = reverse("reservation_statistics_export") + "?updated_after=2024-01-01T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_statistics_export__updated_after__not_in_range(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()

    url = reverse("reservation_statistics_export") + "?updated_after=2024-01-02T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 0


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_statistics_export__updated_before(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create()

    url = reverse("reservation_statistics_export") + "?updated_before=2024-01-02T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 1
    assert data[0]["reservation_uuid"] == str(reservation.ext_uuid)


@freezegun.freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_statistics_export__updated_before__not_in_range(api_client, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create()

    url = reverse("reservation_statistics_export") + "?updated_before=2024-01-01T00:00:00+02:00"
    response = api_client.get(url, headers={"Authorization": settings.EXPORT_AUTHORIZATION_TOKEN})

    assert response.status_code == 200, response.json()

    data = response.json()
    assert len(data) == 0
