from __future__ import annotations

from inspect import cleandoc

import pytest

from tests.factories import PurposeFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__query(graphql):
    purpose = PurposeFactory.create()

    graphql.login_with_superuser()

    query = cleandoc(
        """
        query {
            allPurposes {
                pk
                name {
                    fi
                    en
                    sv
                }
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
            "pk": purpose.pk,
            "name": {
                "fi": purpose.name_fi,
                "en": purpose.name_en,
                "sv": purpose.name_sv,
            },
            "imageUrl": None,
            "smallUrl": None,
            "rank": purpose.rank,
        }
    ]


def test_purpose__order__by_rank(graphql):
    purpose_1 = PurposeFactory.create(rank=1)
    purpose_2 = PurposeFactory.create(rank=3)
    purpose_3 = PurposeFactory.create(rank=2)

    graphql.login_with_superuser()

    query = cleandoc(
        """
        query {
            allPurposes(orderBy: rankDesc) {
                pk
            }
        }
        """
    )

    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": purpose_2.pk}
    assert response.results[1] == {"pk": purpose_3.pk}
    assert response.results[2] == {"pk": purpose_1.pk}
