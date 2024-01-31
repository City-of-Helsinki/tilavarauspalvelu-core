from functools import partial

import pytest

from tests.factories import AbilityGroupFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

ability_groups_query = partial(build_query, "abilityGroups", connection=True, order_by="pk")


def test_ability_group__query__all_fields(graphql):
    # given:
    # - There are two ability groups in the database
    # - A superuser is using the system
    group_1 = AbilityGroupFactory()
    group_2 = AbilityGroupFactory()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for ability groups with all fields
    fields = """
        pk
        nameFi
        nameSv
        nameEn
    """
    response = graphql(ability_groups_query(fields=fields))

    # then:
    # - The response contains no errors
    # - The response contains the two ability groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": group_1.pk,
        "nameFi": group_1.name_fi,
        "nameSv": group_1.name_sv,
        "nameEn": group_1.name_en,
    }
    assert response.node(1) == {
        "pk": group_2.pk,
        "nameFi": group_2.name_fi,
        "nameSv": group_2.name_sv,
        "nameEn": group_2.name_en,
    }


def test_ability_group__filter__by_pk(graphql):
    # given:
    # - There are two ability groups in the database
    # - Regular user is using the system
    group_1 = AbilityGroupFactory()
    AbilityGroupFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for ability groups with a specific pk
    response = graphql(ability_groups_query(pk=group_1.pk))

    # then:
    # - The response contains no errors
    # - The response contains only the selected ability group
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": group_1.pk}


def test_ability_group__filter__by_pk__multiple(graphql):
    # given:
    # - There are two ability groups in the database
    # - Regular user is using the system
    group_1 = AbilityGroupFactory()
    group_2 = AbilityGroupFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for ability groups with specific pks
    response = graphql(ability_groups_query(pk=[group_1.pk, group_2.pk]))

    # then:
    # - The response contains no errors
    # - The response contains both ability groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": group_1.pk}
    assert response.node(1) == {"pk": group_2.pk}


def test_ability_group__filter__by_name(graphql):
    # given:
    # - There are two ability groups with different names in the database
    # - Regular user is using the system
    group_1 = AbilityGroupFactory(name="foo")
    AbilityGroupFactory(name="bar")
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for ability groups with a specific name
    response = graphql(ability_groups_query(name=group_1.name))

    # then:
    # - The response contains no errors
    # - The response contains only the selected ability group
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": group_1.pk}


def test_ability_group__query__regular_user(graphql):
    # given:
    # - There are two ability groups in the database
    # - Regular user is using the system
    group_1 = AbilityGroupFactory()
    group_2 = AbilityGroupFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for ability groups
    response = graphql(ability_groups_query())

    # then:
    # - The response contains no errors
    # - The response contains the two ability groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": group_1.pk}
    assert response.node(1) == {"pk": group_2.pk}


def test_ability_group__query__anonymized(graphql):
    # given:
    # - There are two ability groups in the database
    # - An anonymized user is using the system
    group_1 = AbilityGroupFactory()
    group_2 = AbilityGroupFactory()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - The user queries for ability groups
    response = graphql(ability_groups_query())

    # then:
    # - The response contains no errors
    # - The response contains the two ability groups
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": group_1.pk}
    assert response.node(1) == {"pk": group_2.pk}
