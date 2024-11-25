from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationUnitTypeFactory

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
    query = build_query("reservationUnitTypes", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
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

    query = build_query("reservationUnitTypes", connection=True, order_by="nameFiAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": res_unit_type_1.pk}
    assert response.node(1) == {"pk": res_unit_type_3.pk}
    assert response.node(2) == {"pk": res_unit_type_2.pk}
