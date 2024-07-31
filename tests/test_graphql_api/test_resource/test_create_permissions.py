import pytest

from resources.enums import ResourceLocationType
from resources.models import Resource
from tests.factories import SpaceFactory, UnitGroupFactory, UserFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__create__regular_user(graphql):
    space = SpaceFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."


def test_resource__create__unit_admin__can_manage_resources(graphql):
    space = SpaceFactory.create()

    user = UserFactory.create_with_unit_permissions(unit=space.unit, perms=["can_manage_resources"])
    graphql.force_login(user)

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    assert Resource.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_resource__create__unit_group_admin__can_manage_resources(graphql):
    space = SpaceFactory.create()
    unit_group = UnitGroupFactory.create(units=[space.unit])

    user = UserFactory.create_with_unit_group_permissions(unit_group=unit_group, perms=["can_manage_resources"])
    graphql.force_login(user)

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    assert Resource.objects.filter(pk=response.first_query_object["pk"]).exists()
