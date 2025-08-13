from __future__ import annotations

from functools import partial

import pytest

from tests.factories import AgeGroupFactory
from tests.query_builder import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

age_groups_query = partial(build_query, "allAgeGroups")


def test_age_group__query__all_fields(graphql):
    group_1 = AgeGroupFactory.create(minimum=18, maximum=30)
    group_2 = AgeGroupFactory.create(minimum=31, maximum=60)
    graphql.login_with_superuser()

    fields = """
        pk
        minimum
        maximum
    """
    response = graphql(age_groups_query(fields=fields))

    assert response.has_errors is False, response
    assert response.results == [
        {
            "pk": group_1.pk,
            "minimum": group_1.minimum,
            "maximum": group_1.maximum,
        },
        {
            "pk": group_2.pk,
            "minimum": group_2.minimum,
            "maximum": group_2.maximum,
        },
    ]


def test_age_group__query__regular_user(graphql):
    group_1 = AgeGroupFactory.create(minimum=18, maximum=30)
    group_2 = AgeGroupFactory.create(minimum=31, maximum=60)
    graphql.login_with_regular_user()

    response = graphql(age_groups_query())

    assert response.has_errors is False, response
    assert response.results == [
        {"pk": group_1.pk},
        {"pk": group_2.pk},
    ]


def test_age_group__query__anonymized(graphql):
    group_1 = AgeGroupFactory.create(minimum=18, maximum=30)
    group_2 = AgeGroupFactory.create(minimum=31, maximum=60)

    response = graphql(age_groups_query())

    assert response.has_errors is False, response
    assert response.results == [
        {"pk": group_1.pk},
        {"pk": group_2.pk},
    ]
