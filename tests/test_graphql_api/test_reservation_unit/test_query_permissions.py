import pytest

from tests.factories import ReservationUnitFactory
from tests.factories.application_round_time_slot import ApplicationRoundTimeSlotFactory
from tests.helpers import UserType

from .helpers import TIMESLOTS_QUERY

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


@pytest.mark.parametrize(
    ("user_type", "expected_timeslots"),
    [
        (UserType.ANONYMOUS, 1),
        (UserType.REGULAR, 1),
        (UserType.STAFF, 1),
        (UserType.SUPERUSER, 1),
    ],
)
def test_reservation_unit__query__permissions_by_user_type(graphql, user_type, expected_timeslots):
    # given:
    # - There is a reservation unit with timeslots
    # - The specified user is using the system
    reservation_unit = ReservationUnitFactory.create()
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - The reservation unit timeslots are queried
    response = graphql(TIMESLOTS_QUERY)

    # then:
    # - The response contains the application round timeslots
    assert response.has_errors is False, response
    assert len(response.edges) == expected_timeslots
