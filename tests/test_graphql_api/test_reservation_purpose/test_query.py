from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationPurposeFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_purpose__query(graphql):
    res_purpose = ReservationPurposeFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        rank
    """
    query = build_query("reservationPurposes", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": res_purpose.pk,
        "nameFi": res_purpose.name_fi,
        "nameSv": res_purpose.name_sv,
        "nameEn": res_purpose.name_en,
        "rank": res_purpose.rank,
    }


def test_reservation_purpose__order__by_name(graphql):
    res_purpose_1 = ReservationPurposeFactory.create(name_fi="AAA")
    res_purpose_2 = ReservationPurposeFactory.create(name_fi="CCC")
    res_purpose_3 = ReservationPurposeFactory.create(name_fi="BBB")

    graphql.login_with_superuser()

    query = build_query("reservationPurposes", order_by="nameFiDesc", connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": res_purpose_2.pk}
    assert response.node(1) == {"pk": res_purpose_3.pk}
    assert response.node(2) == {"pk": res_purpose_1.pk}


def test_reservation_purpose__order__by_rank(graphql):
    res_purpose_1 = ReservationPurposeFactory.create(rank=1)
    res_purpose_2 = ReservationPurposeFactory.create(rank=3)
    res_purpose_3 = ReservationPurposeFactory.create(rank=2)

    graphql.login_with_superuser()

    query = build_query("reservationPurposes", order_by="rankDesc", connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": res_purpose_2.pk}
    assert response.node(1) == {"pk": res_purpose_3.pk}
    assert response.node(2) == {"pk": res_purpose_1.pk}
