import pytest

from tilavarauspalvelu.enums import ResourceLocationType

from tests.factories import ResourceFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__update(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    data = {
        "pk": resource.pk,
        "nameFi": "a",
        "nameEn": "b",
        "nameSv": "c",
        "space": resource.space.pk,
        "locationType": ResourceLocationType.FIXED.value.upper(),
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    resource.refresh_from_db()
    assert resource.name_fi == "a"
    assert resource.name_en == "b"
    assert resource.name_sv == "c"
    assert resource.space.pk == resource.space.pk
    assert resource.location_type == ResourceLocationType.FIXED.value


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

    assert response.error_message() == "Location type 'fixed' needs a space to be defined."


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
