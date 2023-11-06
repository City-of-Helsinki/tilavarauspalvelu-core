from datetime import date, datetime

import pytest

from reservations.models import Reservation
from tests.factories import CityFactory, ReservationUnitFactory, UserFactory
from users.helauth.utils import ADLoginAMR

from .helpers import CREATE_MUTATION, mock_opening_hours, mock_profile_reader

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize("arm", ["suomi_fi", "heltunnistussuomifi"])
def test_create_reservation__prefilled_with_profile_data(graphql, settings, arm: str):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True
    reservation_unit = ReservationUnitFactory.create()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr=arm)
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation
    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }
    with mock_profile_reader(), mock_opening_hours(reservation_unit.uuid, date=date(2023, 1, 1)):
        response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The reservation is prefilled from the users profile data
    assert response.has_errors is False, response.errors
    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.reservee_first_name == "John"
    assert reservation.reservee_last_name == "Doe"
    assert reservation.reservee_address_city == "Helsinki"
    assert reservation.reservee_address_street == "Test street 1"
    assert reservation.reservee_address_zip == "00100"
    assert reservation.home_city.name == "Helsinki"


def test_create_reservation__prefilled_with_profile_data__missing(graphql, settings):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True
    reservation_unit = ReservationUnitFactory.create()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr="suomi_fi")
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation, but the profile data is missing
    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }
    with mock_profile_reader(profile_data={}), mock_opening_hours(reservation_unit.uuid, date=date(2023, 1, 1)):
        response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The reservation was not prefilled from the users profile data
    assert response.has_errors is False, response.errors
    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.reservee_first_name == ""
    assert reservation.reservee_last_name == ""
    assert reservation.reservee_address_city == ""
    assert reservation.reservee_address_street == ""
    assert reservation.reservee_address_zip == ""
    assert reservation.home_city is None


@pytest.mark.parametrize("arm", ADLoginAMR)
def test_create_reservation__prefilled_with_profile_data__ad_login(graphql, settings, arm: ADLoginAMR):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Azure AD is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True
    reservation_unit = ReservationUnitFactory.create()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr=arm.value)
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation
    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }
    with mock_profile_reader(), mock_opening_hours(reservation_unit.uuid, date=date(2023, 1, 1)):
        response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The reservation was not prefilled from the users profile data
    assert response.has_errors is False, response.errors
    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.reservee_first_name == ""
    assert reservation.reservee_last_name == ""
    assert reservation.reservee_address_city == ""
    assert reservation.reservee_address_street == ""
    assert reservation.reservee_address_zip == ""
    assert reservation.home_city is None
