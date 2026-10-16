from __future__ import annotations

import pytest

from tilavarauspalvelu.models import Space

from tests.factories import SpaceFactory, UnitFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Update ──


def test_update_space(graphql):
    # given:
    # - There is a space
    # - A superuser is using the system
    space = SpaceFactory.create(name="foo")
    graphql.login_with_superuser()

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has no errors
    # - The space's name has been updated
    assert response.has_errors is False, response
    space.refresh_from_db()
    assert space.name_fi == "bar"


# ── Moving to another unit or parent ──


def test_update_space__unit_admin_cannot_move_space_to_other_unit(graphql):
    space = SpaceFactory.create(name="foo")
    original_unit = space.unit
    other_unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[original_unit])
    graphql.force_login(admin)

    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "unit": other_unit.pk})

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("unit") == ["Space cannot be moved to another unit."]

    space = Space.objects.get(pk=space.pk)
    assert space.unit == original_unit


def test_update_space__superuser_cannot_move_space_to_other_unit(graphql):
    space = SpaceFactory.create(name="foo")
    original_unit = space.unit
    other_unit = UnitFactory.create()
    graphql.login_with_superuser()

    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "unit": other_unit.pk})

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("unit") == ["Space cannot be moved to another unit."]

    space = Space.objects.get(pk=space.pk)
    assert space.unit == original_unit


def test_update_space__unit_admin_can_move_space_under_space_of_same_unit(graphql):
    space = SpaceFactory.create(name="foo")
    new_parent = SpaceFactory.create(name="bar", unit=space.unit)
    admin = UserFactory.create_with_unit_role(units=[space.unit])
    graphql.force_login(admin)

    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "unit": space.unit.pk, "parent": new_parent.pk})

    assert response.has_errors is False, response

    space = Space.objects.get(pk=space.pk)
    assert space.parent == new_parent


def test_update_space__unit_admin_cannot_move_space_under_space_of_other_unit(graphql):
    space = SpaceFactory.create(name="foo")
    other_space = SpaceFactory.create(name="bar")
    admin = UserFactory.create_with_unit_role(units=[space.unit])
    graphql.force_login(admin)

    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "parent": other_space.pk})

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Parent space must be in the same unit."]

    space = Space.objects.get(pk=space.pk)
    assert space.parent is None


# ── Name ──


@pytest.mark.parametrize("name", ["", " "])
def test_update_space__name_fi_cannot_be_empty(graphql, name):
    # given:
    # - There is a space
    # - A superuser is using the system
    space = SpaceFactory.create(name="foo")
    graphql.login_with_superuser()

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "name": name})

    # then:
    # - The response has errors about nameFi field
    # - The space is not updated in the database
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("name") == ["This field may not be blank."]
    space.refresh_from_db()
    assert space.name_fi == "foo"
