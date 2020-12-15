import datetime

import pytest
from django.urls import reverse

from reservations.models import AbilityGroup, AgeGroup, Reservation


@pytest.mark.django_db
def test_reservation_create(user_api_client, valid_reservation_data):
    assert Reservation.objects.count() == 0
    response = user_api_client.post(
        reverse("reservation-list"), data=valid_reservation_data, format="json"
    )
    assert response.status_code == 201
    assert Reservation.objects.count() == 1


@pytest.mark.django_db
def test_reservation_overlapping(user_api_client, reservation, valid_reservation_data):
    """
    Reservation begins 5 minutes before the initial reservation ends,
    so this should return an error
    """
    valid_reservation_data["begin"] = reservation.end - datetime.timedelta(minutes=5)
    valid_reservation_data["end"] = reservation.end + datetime.timedelta(hours=1)
    response = user_api_client.post(
        reverse("reservation-list"), data=valid_reservation_data, format="json"
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_age_group_create(user_api_client):
    assert AgeGroup.objects.count() == 0
    response = user_api_client.post(
        reverse("age_group-list"), data={"minimum": 20, "maximum": 40}, format="json"
    )
    assert response.status_code == 201
    assert AgeGroup.objects.count() == 1


@pytest.mark.django_db
def test_age_group_create_invalid_maximum(user_api_client):
    assert AgeGroup.objects.count() == 0
    response = user_api_client.post(
        reverse("age_group-list"), data={"minimum": 20, "maximum": 10}, format="json"
    )
    assert response.status_code == 400
    assert (
        "Maximum age should be larger than minimum age"
        in response.data["non_field_errors"]
    )


@pytest.mark.django_db
def test_age_group_fetch(user_api_client, ten_to_15_age_group):
    response = user_api_client.get(reverse("age_group-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("minimum") == 10
    assert response.data[0].get("maximum") == 15


@pytest.mark.django_db
def test_ability_group_create(user_api_client):
    assert AbilityGroup.objects.count() == 0
    response = user_api_client.post(
        reverse("ability_group-list"), data={"name": "new group"}, format="json"
    )
    assert response.status_code == 201
    assert AbilityGroup.objects.count() == 1


@pytest.mark.django_db
def test_ability_group_fetch(user_api_client, hobbyist_ability_group):
    response = user_api_client.get(reverse("ability_group-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("name") == "Hobbyist level"
