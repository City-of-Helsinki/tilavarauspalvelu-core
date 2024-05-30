import datetime

import pytest

from common.date_utils import local_date
from reservation_units.enums import ReservationStartInterval
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
    data["abilityGroup"] = ability_group.pk
    data["ageGroup"] = age_group.pk

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    assert recurring_reservation.name == "foo"
    assert recurring_reservation.description == "bar"
    assert recurring_reservation.weekdays == "6"
    assert recurring_reservation.begin_date == datetime.date(2023, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2023, 1, 1)
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

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin time cannot be after end time if on the same day."]
    assert RecurringReservation.objects.exists() is False


def test_recurring_reservations__create__end_time_same_as_begin_time(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["endTime"] = "10:00:00"

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin time cannot be after end time if on the same day."]
    assert RecurringReservation.objects.exists() is False


def test_recurring_reservations__create__end_date_before_begin_date(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["endDate"] = "2022-12-31"

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin date cannot be after end date."]
    assert RecurringReservation.objects.exists() is False


@pytest.mark.parametrize(
    "field",
    [
        "beginDate",
        "beginTime",
        "endTime",
        "endDate",
        "reservationUnit",
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

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("recurrenceInDays") == ["Reoccurrence interval must be a multiple of 7 days."]
    assert RecurringReservation.objects.exists() is False


def test_recurring_reservations__create__start_interval_not_allowed(graphql):
    reservation_unit = ReservationUnitFactory.create(
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["beginTime"] = "09:00:01"

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation start time does not match the allowed interval of 15 minutes."
    ]
    assert RecurringReservation.objects.exists() is False


def test_recurring_reservations__create__end_date_too_far(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = get_minimal_create_date(reservation_unit)
    data["endDate"] = (local_date() + datetime.timedelta(days=365 * 3 + 1)).isoformat()

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Cannot create recurring reservation for more than 2 years in the future."
    ]
    assert RecurringReservation.objects.exists() is False
