import pytest

from reservations.choices import ReservationTypeChoice
from tests.factories import ReservationFactory, ReservationUnitFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_reservation.helpers import reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_filter_reservations_by_reservation_type__single(graphql):
    # given:
    # - There is a reservation in a certain state
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.NORMAL)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter reservations by said type
    response = graphql(reservations_query(reservation_type=ReservationTypeChoice.NORMAL.value))

    # then:
    # - The reservation is returned without errors
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation.pk}


def test_filter_reservations_by_reservation_type__multiple(graphql):
    # given:
    # - There are reservations in a different states
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.NORMAL)
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.STAFF)
    ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.BEHALF)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter reservations by some of those states
    response = graphql(
        reservations_query(
            reservation_type=[
                ReservationTypeChoice.NORMAL.value,
                ReservationTypeChoice.STAFF.value,
            ]
        )
    )

    # then:
    # - The reservation is returned without errors, and contains those in the selected states
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
