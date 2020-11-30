import datetime

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from reservation_units.models import ReservationUnit
from reservations.models import Reservation
from resources.models import Resource


@pytest.mark.django_db
@pytest.fixture
def user():
    return get_user_model().objects.create(
        username="test_user",
        first_name="James",
        last_name="Doe",
        email="james.doe@foo.com",
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_api_client(user):
    api_client = APIClient()
    api_client.force_authenticate(user)
    return api_client


@pytest.fixture
def resource():
    return Resource.objects.create(name="testiresurssi")


@pytest.fixture
def reservation_unit(resource):
    reservation_unit = ReservationUnit.objects.create(
        name="testi", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    return reservation_unit


@pytest.fixture
def reservation(reservation_unit):
    begin_time = datetime.datetime(2020, 12, 1)
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(begin=begin_time, end=end_time)
    reservation.reservation_unit.set([reservation_unit])
    return reservation


@pytest.fixture
def valid_reservation_data(reservation_unit):
    """ Valid JSON data for creating a new Reservation """
    return {
        "begin": "2020-11-10T08:00",
        "end": "2020-11-10T09:30",
        "buffer_time_before": "10",
        "buffer_time_after": "10",
        "reservation_unit": [reservation_unit.id],
    }
