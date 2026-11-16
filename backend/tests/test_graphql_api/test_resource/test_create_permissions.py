import pytest

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

from tests.factories import SpaceFactory, UnitGroupFactory, UserFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__create__regular_user(graphql):
    space = SpaceFactory.create()
    graphql.login_with_regular_user()

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

    user = UserFactory.create_with_unit_role(units=[space.unit])
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

    user = UserFactory.create_with_unit_role(unit_groups=[unit_group])
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
