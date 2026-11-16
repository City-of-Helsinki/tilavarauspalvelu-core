from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import SportFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_sport__query(graphql):
    sport = SportFactory.create()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        rank
    """
    query = build_query("sports", fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {
            "pk": sport.pk,
            "nameFi": sport.name_fi,
            "nameSv": sport.name_sv,
            "nameEn": sport.name_en,
            "rank": sport.rank,
        },
    ]


def test_sport__order__by_rank(graphql):
    sport_1 = SportFactory.create(rank=2)
    sport_2 = SportFactory.create(rank=0)
    sport_3 = SportFactory.create(rank=1)

    query = build_query("sports", order_by="rankAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {"pk": sport_2.pk},
        {"pk": sport_3.pk},
        {"pk": sport_1.pk},
    ]
