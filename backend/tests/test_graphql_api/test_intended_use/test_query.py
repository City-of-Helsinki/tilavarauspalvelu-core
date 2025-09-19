from __future__ import annotations

from inspect import cleandoc

import pytest

from tests.factories import IntendedUseFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_intended_use__query(graphql):
    intended_use = IntendedUseFactory.create()

    graphql.login_with_superuser()

    query = cleandoc(
        """
        query {
            allIntendedUses {
                pk
                nameFi
                nameEn
                nameSv
                imageUrl
                smallUrl
                rank
            }
        }
        """
    )
    response = graphql(query)

    assert response.has_errors is False

    assert response.results == [
        {
            "pk": intended_use.pk,
            "nameFi": intended_use.name_fi,
            "nameEn": intended_use.name_en,
            "nameSv": intended_use.name_sv,
            "imageUrl": None,
            "smallUrl": None,
            "rank": intended_use.rank,
        }
    ]


def test_intended_use__order__by_rank(graphql):
    intended_use_1 = IntendedUseFactory.create(rank=1)
    intended_use_2 = IntendedUseFactory.create(rank=3)
    intended_use_3 = IntendedUseFactory.create(rank=2)

    graphql.login_with_superuser()

    query = cleandoc(
        """
        query {
            allIntendedUses(orderBy: rankDesc) {
                pk
            }
        }
        """
    )

    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": intended_use_2.pk}
    assert response.results[1] == {"pk": intended_use_3.pk}
    assert response.results[2] == {"pk": intended_use_1.pk}
