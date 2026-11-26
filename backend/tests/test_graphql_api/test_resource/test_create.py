from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

from tests.factories import SpaceFactory

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__create(graphql: GraphQLClient) -> None:
    space = SpaceFactory.create()
    graphql.login_with_superuser()

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

    resource = Resource.objects.get(pk=response.first_query_object["pk"])
    assert resource.name_fi == "a"
    assert resource.name_en == "b"
    assert resource.name_sv == "c"
    assert resource.space is not None
    assert resource.space.pk == space.pk
    assert resource.location_type == ResourceLocationType.FIXED.value


@pytest.mark.parametrize("field", ["nameFi", "nameEn", "nameSv"])
def test_resource__create__missing_name(graphql: GraphQLClient, field: str) -> None:
    space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    del data[field]
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    assert Resource.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_resource__create__no_space_fixed_location(graphql: GraphQLClient) -> None:
    graphql.login_with_superuser()

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Location type 'fixed' needs a space to be defined."]


def test_resource__create__no_space_movable_location(graphql: GraphQLClient) -> None:
    graphql.login_with_superuser()

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "locationType": ResourceLocationType.MOVABLE.value.upper(),
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    resource = Resource.objects.get(pk=response.first_query_object["pk"])
    assert resource.name_fi == "a"
    assert resource.name_en == "b"
    assert resource.name_sv == "c"
    assert resource.location_type == ResourceLocationType.MOVABLE.value


def test_resource__create__wrong_location_type(graphql: GraphQLClient) -> None:
    space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "name": "abc",
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": "foo",
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Variable '$input'")
