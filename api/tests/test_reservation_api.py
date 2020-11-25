import pytest
import datetime

from django.urls import reverse

from reservations.models import Reservation


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
