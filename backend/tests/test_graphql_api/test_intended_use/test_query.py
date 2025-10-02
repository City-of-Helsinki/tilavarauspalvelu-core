from __future__ import annotations

import pytest

from tests.factories import IntendedUseFactory

from .helpers import intended_uses_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__query(graphql):
    intended_use = IntendedUseFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameEn
        nameSv
        imageUrl
        smallUrl
        rank
    """
    query = intended_uses_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": intended_use.pk,
        "nameFi": intended_use.name_fi,
        "nameEn": intended_use.name_en,
        "nameSv": intended_use.name_sv,
        "imageUrl": None,
        "smallUrl": None,
        "rank": intended_use.rank,
    }


def test_purpose__order__by_rank(graphql):
    intended_use_1 = IntendedUseFactory.create(rank=1)
    intended_use_2 = IntendedUseFactory.create(rank=3)
    intended_use_3 = IntendedUseFactory.create(rank=2)

    graphql.login_with_superuser()

    query = intended_uses_query(order_by="rankDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": intended_use_2.pk}
    assert response.node(1) == {"pk": intended_use_3.pk}
    assert response.node(2) == {"pk": intended_use_1.pk}
