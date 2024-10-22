from functools import partial

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import AgeGroupFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

age_groups_query = partial(build_query, "ageGroups", connection=True)


def test_age_group__query__all_fields(graphql):
    # given:
    # - There are two age groups in the database
    # - A superuser is using the system
    group_1 = AgeGroupFactory(minimum=18, maximum=30)
    group_2 = AgeGroupFactory(minimum=31, maximum=60)
    graphql.login_with_superuser()

    # when:
    # - The user queries for age groups with all fields
    fields = """
        pk
        minimum
        maximum
    """
    response = graphql(age_groups_query(fields=fields))

    # then:
    # - The response contains no errors
    # - The response contains the two age groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": group_1.pk,
        "minimum": group_1.minimum,
        "maximum": group_1.maximum,
    }
    assert response.node(1) == {
        "pk": group_2.pk,
        "minimum": group_2.minimum,
        "maximum": group_2.maximum,
    }


def test_age_group__query__regular_user(graphql):
    # given:
    # - There are two age groups in the database
    # - Regular user is using the system
    group_1 = AgeGroupFactory(minimum=18, maximum=30)
    group_2 = AgeGroupFactory(minimum=31, maximum=60)
    graphql.login_with_regular_user()

    # when:
    # - The user queries for age groups
    response = graphql(age_groups_query())

    # then:
    # - The response contains no errors
    # - The response contains the two age groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": group_1.pk}
    assert response.node(1) == {"pk": group_2.pk}


def test_age_group__query__anonymized(graphql):
    # given:
    # - There are two age groups in the database
    # - An anonymized user is using the system
    group_1 = AgeGroupFactory(minimum=18, maximum=30)
    group_2 = AgeGroupFactory(minimum=31, maximum=60)

    # when:
    # - The user queries for age groups
    response = graphql(age_groups_query())

    # then:
    # - The response contains no errors
    # - The response contains the two age groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": group_1.pk}
    assert response.node(1) == {"pk": group_2.pk}
