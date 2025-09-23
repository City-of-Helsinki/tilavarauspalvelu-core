from __future__ import annotations

import pytest

from tests.factories import SpaceFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


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
