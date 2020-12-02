import pytest
import datetime
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

from reservation_units.models import ReservationUnit, Purpose
from reservations.models import Reservation
from resources.models import Resource
from applications.models import ApplicationPeriod
from spaces.models import Space, Location, District


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
    return Resource.objects.create(name="Test resource")


@pytest.fixture
def space(location):
    return Space.objects.create(name="Space", location=location)


@pytest.fixture
def reservation_unit(resource, space):
    reservation_unit = ReservationUnit.objects.create(
        name="Test reservation unit", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    reservation_unit.spaces.set([space])
    return reservation_unit


@pytest.fixture
def location():
    return Location.objects.create(
        address_street="Osoitetienkatu 13b", address_zip="33540", address_city="Tampere"
    )


@pytest.fixture
def reservation_unit2(resource):
    reservation_unit = ReservationUnit.objects.create(
        name="Test reservation unit no. 2", require_introduction=False
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


@pytest.fixture
def purpose():
    return Purpose.objects.create(name="Holding a meeting")


@pytest.fixture
def purpose2():
    return Purpose.objects.create(name="Playing sports")


@pytest.fixture
def application_period():
    return ApplicationPeriod.objects.create(
        name="Hakemuskausi",
        application_period_begin=datetime.datetime(2020, 11, 1),
        application_period_end=datetime.datetime(2020, 12, 1),
        reservation_period_begin=datetime.datetime(2020, 11, 1),
        reservation_period_end=datetime.datetime(2020, 12, 1),
    )


@pytest.fixture
def district():
    return District.objects.create(name="Tapaninkylä")


@pytest.fixture
def sub_district(district):
    return District.objects.create(name="Tapanila", parent=district)
