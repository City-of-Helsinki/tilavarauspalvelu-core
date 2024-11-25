from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import KeywordFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_keywords__query(graphql):
    keyword = KeywordFactory.create()

    graphql.login_with_superuser()
    query = build_query("keywords", fields="nameFi", connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node() == {
        "nameFi": keyword.name,
    }


def test_keyword_groups__query(graphql):
    keyword = KeywordFactory.create()

    graphql.login_with_superuser()
    query = build_query("keywordGroups", fields="nameFi keywords { nameFi }", connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node() == {
        "nameFi": keyword.keyword_group.name_fi,
        "keywords": [
            {
                "nameFi": keyword.name_fi,
            },
        ],
    }


def test_keyword_category__query(graphql):
    keyword = KeywordFactory.create()

    graphql.login_with_superuser()
    query = build_query(
        "keywordCategories",
        fields="nameFi keywordGroups { nameFi  keywords { nameFi } }",
        connection=True,
    )
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node() == {
        "nameFi": keyword.keyword_group.keyword_category.name_fi,
        "keywordGroups": [
            {
                "nameFi": keyword.keyword_group.name_fi,
                "keywords": [
                    {
                        "nameFi": keyword.name_fi,
                    },
                ],
            }
        ],
    }
