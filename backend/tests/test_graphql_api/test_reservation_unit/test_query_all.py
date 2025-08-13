from __future__ import annotations

import pytest

from tests.factories import ReservationUnitFactory, UserFactory
from tests.test_graphql_api.test_reservation_unit.helpers import reservation_units_all_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_all__filter__by_name_fi(graphql):
    reservation_unit = ReservationUnitFactory.create(name_fi="foo")
    ReservationUnitFactory.create(name_fi="bar")

    query = reservation_units_all_query(nameFiExact="foo")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.results) == 1
    assert response.results[0] == {"pk": reservation_unit.pk}


def test_reservation_unit_all__filter__only_with_permission__general_admin(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    query = reservation_units_all_query(onlyWithPermission=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.results) == 2
    assert response.results[0] == {"pk": reservation_unit_1.pk}
    assert response.results[1] == {"pk": reservation_unit_2.pk}
