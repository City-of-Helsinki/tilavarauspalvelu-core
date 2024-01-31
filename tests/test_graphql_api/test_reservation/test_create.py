from datetime import datetime, timedelta

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from reservations.models import Reservation
from tests.factories import (
    CityFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)
from tests.helpers import UserType
from users.helauth.utils import ADLoginAMR

from .helpers import CREATE_MUTATION, mock_profile_reader

DEFAULT_TIMEZONE = get_default_timezone()

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("arm", ["suomi_fi", "heltunnistussuomifi"])
@freezegun.freeze_time("2021-01-01")
def test_create_reservation__prefilled_with_profile_data(graphql, settings, arm: str):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - The reservation unit has reservable time span
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True
    reservation_unit = ReservationUnitFactory.create(origin_hauki_resource=OriginHaukiResourceFactory(id=999))
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
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

    with mock_profile_reader():
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


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__prefilled_with_profile_data__missing(graphql, settings):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True
    reservation_unit = ReservationUnitFactory.create(origin_hauki_resource=OriginHaukiResourceFactory(id=999))
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
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
@freezegun.freeze_time("2021-01-01")
def test_create_reservation__prefilled_with_profile_data__ad_login(graphql, settings, arm: ADLoginAMR):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Azure AD is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True
    reservation_unit = ReservationUnitFactory.create(origin_hauki_resource=OriginHaukiResourceFactory(id=999))
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
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


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day__midnight(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2022, 12, 31, 0, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 3, 0, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=0)
    assert reservation.buffer_time_after == timedelta(hours=0)


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day__previous_reservation_blocks(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day__next_reservation_blocks(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=datetime(2023, 1, 1, 16, tzinfo=DEFAULT_TIMEZONE),
        end=datetime(2023, 1, 1, 17, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."
