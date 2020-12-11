import datetime

import pytest
import recurrence
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationPeriod,
    Organisation,
    Person,
    Recurrence,
)
from reservation_units.models import Purpose, ReservationUnit
from reservations.models import Reservation, ReservationPurpose
from resources.models import Resource
from spaces.models import District, Location, Space


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
def application_period(reservation_unit):
    application_period = ApplicationPeriod.objects.create(
        name="Nuorten liikuntavuorot kevät 2021",
        application_period_begin="2021-01-01",
        application_period_end="2021-01-31",
        reservation_period_begin="2021-01-01",
        reservation_period_end="2021-06-01",
    )

    application_period.reservation_units.set([reservation_unit])

    return application_period


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
def district():
    return District.objects.create(name="Tapaninkylä")


@pytest.fixture
def sub_district(district):
    return District.objects.create(name="Tapanila", parent=district)


@pytest.fixture
def purpose() -> Purpose:
    return Purpose.objects.create(name="Exercise")


@pytest.fixture
def purpose2() -> Purpose:
    return Purpose.objects.create(name="Playing sports")


@pytest.fixture
def reservation_purpose(purpose, reservation) -> ReservationPurpose:
    return ReservationPurpose.objects.create(purpose=purpose, reservation=reservation)


@pytest.fixture
def organisation() -> Organisation:
    return Organisation.objects.create(name="Exercise organisation")


@pytest.fixture
def person() -> Person:
    return Person.objects.create(first_name="John", last_name="Legend")


@pytest.fixture
def application(
    purpose, reservation_purpose, organisation, person, application_period, user
) -> Application:
    application = Application.objects.create(
        description="Application for exercise spaces",
        reservation_purpose=reservation_purpose,
        organisation=organisation,
        contact_person=person,
        application_period=application_period,
        user=user,
    )
    return application


@pytest.fixture
def application_event(application) -> ApplicationEvent:
    return ApplicationEvent.objects.create(
        application=application,
        num_persons=10,
        num_events=2,
        duration=datetime.timedelta(hours=1),
    )


@pytest.fixture
def weekly_recurring_mondays_and_tuesdays_2021(application_event) -> ApplicationEvent:

    return Recurrence.objects.create(
        application_event=application_event,
        recurrence=recurrence.Recurrence(
            include_dtstart=False,
            dtstart=timezone.datetime(2021, 1, 4, 0, 0, 0),
            dtend=timezone.datetime(2021, 12, 28, 0, 0, 0),
            rrules=[
                recurrence.Rule(
                    recurrence.WEEKLY, byday=[recurrence.MONDAY, recurrence.TUESDAY]
                )
            ],
        ),
        priority=200,
    )
