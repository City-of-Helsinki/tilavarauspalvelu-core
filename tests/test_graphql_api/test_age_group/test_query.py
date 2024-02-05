from functools import partial

import pytest

from tests.factories import AgeGroupFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

age_groups_query = partial(build_query, "ageGroups", connection=True)


def test_age_group__query__all_fields(graphql):
    # given:
    # - There are two age groups in the database
    # - A superuser is using the system
    group_1 = AgeGroupFactory()
    group_2 = AgeGroupFactory()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

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
    group_1 = AgeGroupFactory()
    group_2 = AgeGroupFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

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
    group_1 = AgeGroupFactory()
    group_2 = AgeGroupFactory()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

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
