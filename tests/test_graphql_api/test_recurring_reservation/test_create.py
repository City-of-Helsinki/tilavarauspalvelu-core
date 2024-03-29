import datetime

import pytest

from reservations.models import RecurringReservation
from tests.factories import AbilityGroupFactory, AgeGroupFactory, ReservationUnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION, get_minimal_create_date

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__create__full_data(graphql):
    ability_group = AbilityGroupFactory.create()
    age_group = AgeGroupFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["name"] = "foo"
    data["description"] = "bar"
    data["abilityGroupPk"] = ability_group.pk
    data["ageGroupPk"] = age_group.pk

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    assert recurring_reservation.name == "foo"
    assert recurring_reservation.description == "bar"
    assert recurring_reservation.weekdays == "0"
    assert recurring_reservation.begin_date == datetime.date(2023, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2023, 1, 2)
    assert recurring_reservation.begin_time == datetime.time(10, 0, 0)
    assert recurring_reservation.end_time == datetime.time(12, 0, 0)
    assert recurring_reservation.recurrence_in_days == 7
    assert recurring_reservation.reservation_unit == reservation_unit
    assert recurring_reservation.ability_group == ability_group
    assert recurring_reservation.age_group == age_group
    assert recurring_reservation.user == user


def test_recurring_reservations__create__end_time_before_begin_time(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["endTime"] = "09:00:00"

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Begin time cannot be after end time."
    assert RecurringReservation.objects.exists() is False


def test_recurring_reservations__create__end_date_before_begin_date(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["endDate"] = "2022-12-31"

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Begin date cannot be after end date."
    assert RecurringReservation.objects.exists() is False


@pytest.mark.parametrize(
    "field",
    [
        "beginDate",
        "beginTime",
        "endTime",
        "endDate",
        "reservationUnitPk",
        "recurrenceInDays",
        "weekdays",
    ],
)
def test_recurring_reservations__create__missing_required_fields(graphql, field):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    del data[field]

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is True
    assert RecurringReservation.objects.exists() is False


def test_recurring_reservations__create__description_can_be_empty(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["description"] = ""

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False
    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    assert recurring_reservation.description == ""


def test_recurring_reservations__create__recurrence_in_days_not_in_allowed_values(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["recurrenceInDays"] = 1

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Interval value not allowed, allowed values are 7,14,28 etc. divisible by seven."
    assert RecurringReservation.objects.exists() is False
