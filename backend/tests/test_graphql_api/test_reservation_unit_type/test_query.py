from __future__ import annotations

import pytest

from tests.factories import ReservationUnitTypeFactory
from tests.query_builder import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_type__query(graphql):
    res_unit_type = ReservationUnitTypeFactory.create(name="foo")

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        rank
    """
    query = build_query("allReservationUnitTypes", fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 1
    assert response.results[0] == {
        "pk": res_unit_type.pk,
        "nameFi": res_unit_type.name_fi,
        "nameSv": res_unit_type.name_sv,
        "nameEn": res_unit_type.name_en,
        "rank": res_unit_type.rank,
    }


def test_reservation_unit_type__order__by_name(graphql):
    res_unit_type_1 = ReservationUnitTypeFactory.create(name="1")
    res_unit_type_2 = ReservationUnitTypeFactory.create(name="3")
    res_unit_type_3 = ReservationUnitTypeFactory.create(name="2")

    graphql.login_with_superuser()

    query = build_query("allReservationUnitTypes", order_by="nameFiAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": res_unit_type_1.pk}
    assert response.results[1] == {"pk": res_unit_type_3.pk}
    assert response.results[2] == {"pk": res_unit_type_2.pk}
