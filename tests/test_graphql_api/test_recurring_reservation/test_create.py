import datetime
from typing import Any, NamedTuple

import pytest

from applications.choices import WeekdayChoice
from reservations.models import RecurringReservation
from tests.factories import AbilityGroupFactory, AgeGroupFactory, ReservationUnitFactory
from tests.helpers import UserType, parametrize_helper

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_recurring_reservation__create__minimal(graphql):
    # given:
    # - There is a reservation unit
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user creates a recurring reservation with minimal input data
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The recurring reservation is created successfully
    assert response.has_errors is False, response
    objs: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(objs) == 1
    assert objs[0].reservation_unit == reservation_unit


def test_recurring_reservation__create__full(graphql):
    # given:
    # - There is a reservation unit, an age group, and an ability group
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    age_group = AgeGroupFactory.create()
    ability_group = AbilityGroupFactory.create()
    user = graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user creates a recurring reservation with all fields given
    start_datetime = datetime.datetime(2021, 1, 1, hour=8, tzinfo=datetime.UTC)
    end_datetime = datetime.datetime(2021, 12, 31, hour=10, tzinfo=datetime.UTC)
    input_data = {
        "name": "foo",
        "description": "bar",
        "beginDate": start_datetime.date().isoformat(),
        "beginTime": start_datetime.time().isoformat(),
        "endDate": end_datetime.date().isoformat(),
        "endTime": end_datetime.time().isoformat(),
        "recurrenceInDays": 7,
        "weekdays": [WeekdayChoice.MONDAY.value],
        "reservationUnit": reservation_unit.pk,
        "ageGroup": age_group.pk,
        "abilityGroup": ability_group.pk,
    }
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The recurring reservation is created successfully
    assert response.has_errors is False, response
    objs: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(objs) == 1
    assert objs[0].name == "foo"
    assert objs[0].description == "bar"
    assert objs[0].begin_date == start_datetime.date()
    assert objs[0].begin_time == start_datetime.time()
    assert objs[0].end_date == end_datetime.date()
    assert objs[0].end_time == end_datetime.time()
    assert objs[0].recurrence_in_days == 7
    assert objs[0].weekdays == [WeekdayChoice.MONDAY.value]
    assert objs[0].reservation_unit == reservation_unit
    assert objs[0].age_group == age_group
    assert objs[0].ability_group == ability_group
    assert objs[0].user == user


class Params(NamedTuple):
    input_data: dict[str, Any]
    has_errors: bool = True


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "All fields null": Params(
                input_data={
                    "beginDate": None,
                    "beginTime": None,
                    "endDate": None,
                    "endTime": None,
                },
                has_errors=False,
            ),
            "Only begin date null": Params(
                input_data={
                    "beginDate": None,
                    "beginTime": "08:00:00",
                    "endDate": "2021-12-31",
                    "endTime": "10:00:00",
                },
            ),
            "Only begin time null": Params(
                input_data={
                    "beginDate": "2021-01-01",
                    "beginTime": None,
                    "endDate": "2021-12-31",
                    "endTime": "10:00:00",
                },
            ),
            "Only end date null": Params(
                input_data={
                    "beginDate": "2021-01-01",
                    "beginTime": "08:00:00",
                    "endDate": None,
                    "endTime": "10:00:00",
                },
            ),
            "Only end time null": Params(
                input_data={
                    "beginDate": "2021-01-01",
                    "beginTime": "08:00:00",
                    "endDate": "2021-12-31",
                    "endTime": None,
                },
            ),
            "End time before begin time, end date after begin date": Params(
                input_data={
                    "beginDate": "2021-01-01",
                    "beginTime": "10:00:00",
                    "endDate": "2021-12-31",
                    "endTime": "08:00:00",
                },
                has_errors=False,
            ),
            "End time before begin time, end date sames as begin date": Params(
                input_data={
                    "beginDate": "2021-01-01",
                    "beginTime": "10:00:00",
                    "endDate": "2021-01-01",
                    "endTime": "08:00:00",
                },
            ),
            "End time after begin time, end date before begin date": Params(
                input_data={
                    "beginDate": "2021-01-02",
                    "beginTime": "08:00:00",
                    "endDate": "2021-01-01",
                    "endTime": "10:00:00",
                },
            ),
        },
    )
)
def test_recurring_reservation__create__validate_begin_and_end_times(graphql, input_data, has_errors):
    # given:
    # - There is a reservation unit
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user creates a recurring reservation with different begin and end times
    input_data["reservationUnit"] = reservation_unit.pk
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about begin and end times if they are invalid
    assert response.has_errors is has_errors, response
    if has_errors:
        msg = "Reoccurring reservation must begin before it ends, or all fields must be null."
        assert response.field_error_messages() == [msg]


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "null": Params(input_data={"recurrenceInDays": None}, has_errors=False),
            "0": Params(input_data={"recurrenceInDays": 0}),
            "6": Params(input_data={"recurrenceInDays": 6}),
            "7": Params(input_data={"recurrenceInDays": 7}, has_errors=False),
            "8": Params(input_data={"recurrenceInDays": 8}),
            "14": Params(input_data={"recurrenceInDays": 14}, has_errors=False),
            "21": Params(input_data={"recurrenceInDays": 21}, has_errors=False),
        },
    )
)
def test_recurring_reservation__create__validate_recurrence_in_days(graphql, input_data, has_errors):
    # given:
    # - There is a reservation unit
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user creates a recurring reservation with different recurrence in days values
    input_data["reservationUnit"] = reservation_unit.pk
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about recurrence in days if it is invalid
    assert response.has_errors is has_errors, response
    if has_errors:
        msg = "`recurrence_in_days` value must be null or a multiple of seven."
        assert response.field_error_messages() == [msg]
