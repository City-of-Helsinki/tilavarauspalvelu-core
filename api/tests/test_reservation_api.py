import pytest
from django.urls import reverse
from reservations.models import Reservation


@pytest.mark.django_db
def test_foobar(user_api_client, valid_reservation_data):
    assert Reservation.objects.count() == 0
    response = user_api_client.post(reverse("reservation-list"), valid_reservation_data)
    assert response.status_code == 201
    assert Reservation.objects.count() == 1
