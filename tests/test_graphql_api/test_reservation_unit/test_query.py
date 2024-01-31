import pytest

from tests.factories import ReservationUnitFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_reservation_unit.helpers import reservation_unit_by_pk_query, reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_reservation_unit_by_pk__query__reservation_blocks_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(reservation_block_whole_day=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_unit_by_pk_query(fields="pk reservationBlockWholeDay", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {
        "pk": reservation_unit.pk,
        "reservationBlockWholeDay": reservation_unit.reservation_block_whole_day,
    }


def test_reservation_units__query__reservation_blocks_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(reservation_block_whole_day=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_units_query(fields="pk reservationBlockWholeDay")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "reservationBlockWholeDay": reservation_unit.reservation_block_whole_day,
    }
