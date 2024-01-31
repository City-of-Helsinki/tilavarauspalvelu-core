import datetime

import pytest

from applications.choices import WeekdayChoice
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory
from tests.factories.application_round_time_slot import ApplicationRoundTimeSlotFactory
from tests.helpers import UserType

from .helpers import TIMESLOTS_QUERY, reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__query__timeslots(graphql):
    # given:
    # - There is a reservation unit with timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit, weekday=WeekdayChoice.MONDAY)
    ApplicationRoundTimeSlotFactory.create_closed(reservation_unit=reservation_unit, weekday=WeekdayChoice.WEDNESDAY)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The reservation unit timeslots are queried
    response = graphql(TIMESLOTS_QUERY)

    # then:
    # - The response contains the application round timeslots
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "closed": False,
                "reservableTimes": [
                    {
                        "begin": "10:00:00",
                        "end": "12:00:00",
                    }
                ],
            },
            {
                "weekday": WeekdayChoice.WEDNESDAY.value,
                "closed": True,
                "reservableTimes": [],
            },
        ]
    }


def test_reservation_unit__query__timeslots__not_found(graphql):
    # given:
    # - There is a reservation unit without any timeslots
    # - A superuser is using the system
    ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The reservation unit timeslots are queried
    response = graphql(TIMESLOTS_QUERY)

    # then:
    # - The response contains no timeslots
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"applicationRoundTimeSlots": []}


def test_reservation__query__include_reservations_with_same_components(graphql):
    space_1 = SpaceFactory.create()
    space_2 = SpaceFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(spaces=[space_1, space_2])
    reservation_unit_2 = ReservationUnitFactory.create(spaces=[space_2])

    reservation_1: Reservation = ReservationFactory.create(
        name="foo",
        begin=datetime.datetime(2024, 1, 1, hour=12, tzinfo=datetime.UTC),
        end=datetime.datetime(2024, 1, 1, hour=14, tzinfo=datetime.UTC),
        reservation_unit=[reservation_unit_1],
        state=ReservationStateChoice.CONFIRMED,
    )
    reservation_2: Reservation = ReservationFactory.create(
        name="bar",
        begin=datetime.datetime(2024, 1, 2, hour=13, tzinfo=datetime.UTC),
        end=datetime.datetime(2024, 1, 2, hour=15, tzinfo=datetime.UTC),
        reservation_unit=[reservation_unit_2],
        state=ReservationStateChoice.CONFIRMED,
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    fields = """
        pk
        reservations {
            name
            begin
            end
        }
    """
    query = reservation_units_query(
        fields=fields,
        reservations__from=datetime.datetime(2024, 1, 1).date().isoformat(),
        reservations__to=datetime.datetime(2024, 1, 2).date().isoformat(),
        reservations__include_with_same_components=True,
    )

    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {
        "pk": reservation_unit_1.pk,
        "reservations": [
            {
                "name": "foo",
                "begin": reservation_1.begin.isoformat(),
                "end": reservation_1.end.isoformat(),
            },
            {
                "name": "bar",
                "begin": reservation_2.begin.isoformat(),
                "end": reservation_2.end.isoformat(),
            },
        ],
    }
    assert response.node(1) == {
        "pk": reservation_unit_2.pk,
        "reservations": [
            {
                "name": "foo",
                "begin": reservation_1.begin.isoformat(),
                "end": reservation_1.end.isoformat(),
            },
            {
                "name": "bar",
                "begin": reservation_2.begin.isoformat(),
                "end": reservation_2.end.isoformat(),
            },
        ],
    }
