import pytest

from tests.factories import SpaceFactory, UserFactory
from tests.helpers import UserType

from .helpers import spaces_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_regular_user__only_with_permissions(graphql):
    # given:
    # - There are two spaces in the database
    # - A regular user is using the system
    SpaceFactory.create()
    SpaceFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to search for spaces with all fields
    response = graphql(spaces_query(onlyWithPermission=True))

    # then:
    # - The response contains no spaces
    assert len(response.edges) == 0


def test_general_admin__only_with_permissions(graphql):
    # given:
    # - There are two spaces in the database
    # - A general admin is using the system
    SpaceFactory.create()
    SpaceFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to search for spaces with all fields
    response = graphql(spaces_query(onlyWithPermission=True))

    # then:
    # - The response contains both spaces
    assert len(response.edges) == 2


def test_unit_admin__only_with_permissions(graphql):
    # given:
    # - There are two spaces in the database
    # - A unit admin for one of the space's unit's is using the system
    space = SpaceFactory.create()
    SpaceFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit=space.unit, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to search for spaces with all fields
    response = graphql(spaces_query(onlyWithPermission=True))

    # then:
    # - The response contains the space the user has access to
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": space.pk}


def test_unit_group_admin__only_with_permissions(graphql):
    # given:
    # - There are two spaces in the database
    # - A unit group admin for one of the space's unit's groups is using the system
    space = SpaceFactory.create(unit__unit_groups__name="foo")
    SpaceFactory.create(unit__unit_groups__name="bar")
    unit_group = space.unit.unit_groups.first()
    admin = UserFactory.create_with_unit_group_permissions(unit_group=unit_group, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to search for spaces with all fields
    response = graphql(spaces_query(onlyWithPermission=True))

    # then:
    # - The response contains the space the user has access to
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": space.pk}
