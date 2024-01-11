import pytest

from tests.factories import ReservationUnitFactory

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__filter__by_text_search_and_other_filters(graphql):
    # given:
    # - There are two reservation units with different equipments
    reservation_unit = ReservationUnitFactory.create(name="foo")
    ReservationUnitFactory.create(name="foo bar")

    # when:
    # - The user requests reservation units with a specific equipment
    query = reservation_units_query(text_search="foo", unit=reservation_unit.unit.pk)
    response = graphql(query)

    # then:
    # - The response contains only the expected reservation unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_unit.pk}
