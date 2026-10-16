from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

from tests.factories import ResourceFactory, SpaceFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Update ──


def test_resource__update(graphql):
    resource = ResourceFactory.create()
    space = SpaceFactory.create(unit=resource.space.unit)
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": space.pk,
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    resource.refresh_from_db()
    assert resource.name_fi == "a"
    assert resource.name_en == "b"
    assert resource.name_sv == "c"
    assert resource.space.pk == space.pk
    assert resource.location_type == ResourceLocationType.FIXED.value


# ── Moving to another space ──


def test_resource__update__unit_admin__move_to_space_of_same_unit(graphql):
    resource = ResourceFactory.create()
    new_space = SpaceFactory.create(unit=resource.space.unit)
    admin = UserFactory.create_with_unit_role(units=[resource.space.unit])
    graphql.force_login(admin)

    data = {
        "pk": resource.pk,
        "space": new_space.pk,
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    resource = Resource.objects.get(pk=resource.pk)
    assert resource.space == new_space


def test_resource__update__unit_admin__move_to_space_of_other_unit(graphql):
    resource = ResourceFactory.create()
    original_space = resource.space
    other_space = SpaceFactory.create()
    admin = UserFactory.create_with_unit_role(units=[original_space.unit])
    graphql.force_login(admin)

    data = {
        "pk": resource.pk,
        "space": other_space.pk,
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("space") == ["Resource cannot be moved to a space in another unit."]

    resource = Resource.objects.get(pk=resource.pk)
    assert resource.space == original_space


def test_resource__update__superuser__move_to_space_of_other_unit(graphql):
    resource = ResourceFactory.create()
    original_space = resource.space
    other_space = SpaceFactory.create()
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "space": other_space.pk,
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("space") == ["Resource cannot be moved to a space in another unit."]

    resource = Resource.objects.get(pk=resource.pk)
    assert resource.space == original_space


# ── Fields and location ──


def test_resource__update__remove_translations(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "name": "abc",
        "nameEn": None,
        "nameSv": None,
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    resource.refresh_from_db()
    assert resource.name_en is None
    assert resource.name_sv is None


def test_resource__update__empty_name_fi(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "name": "",
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("name") == ["This field may not be blank."]


def test_resource__update__null_space_with_fixed_location(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "space": None,
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Location type 'fixed' needs a space to be defined."]


def test_resource__update__null_space_with_movable_location(graphql):
    resource = ResourceFactory.create(location_type=ResourceLocationType.MOVABLE)
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "space": None,
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    resource.refresh_from_db()
    assert resource.space is None
    assert resource.location_type == ResourceLocationType.MOVABLE


def test_resource__update__bad_location(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "locationType": "foo",
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Variable '$input'")
