import pytest

from applications.choices import WeekdayChoice
from tests.factories import ReservationUnitFactory
from tests.factories.application_round_time_slot import ApplicationRoundTimeSlotFactory
from tests.helpers import UserType

from .helpers import TIMESLOTS_QUERY

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
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
