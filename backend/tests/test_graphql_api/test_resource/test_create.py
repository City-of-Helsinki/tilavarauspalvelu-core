from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

from tests.factories import SpaceFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__create(graphql):
    space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    resource = Resource.objects.get(pk=response.results["pk"])
    assert resource.name_fi == "a"
    assert resource.name_en == "b"
    assert resource.name_sv == "c"
    assert resource.space.pk == space.pk
    assert resource.location_type == ResourceLocationType.FIXED


def test_resource__create__missing_name_fi(graphql):
    space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "This field cannot be blank."


@pytest.mark.parametrize("field", ["nameEn", "nameSv"])
def test_resource__create__missing_name_translation(graphql, field):
    space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED,
    }
    del data[field]
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    assert Resource.objects.filter(pk=response.results["pk"]).exists()


def test_resource__create__no_space_fixed_location(graphql):
    graphql.login_with_superuser()

    data = {
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "locationType": ResourceLocationType.FIXED,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Location type 'fixed' needs a space to be defined."


def test_resource__create__no_space_movable_location(graphql):
    graphql.login_with_superuser()

    data = {
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "locationType": ResourceLocationType.MOVABLE,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    resource = Resource.objects.get(pk=response.results["pk"])
    assert resource.name_fi == "a"
    assert resource.name_en == "b"
    assert resource.name_sv == "c"
    assert resource.location_type == ResourceLocationType.MOVABLE


def test_resource__create__wrong_location_type(graphql):
    space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": "foo",
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0).startswith("Variable '$input'")
