from __future__ import annotations

import pytest

from tests.factories import IntendedUseFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_intended_use__update__regular_user(graphql):
    intended_use = IntendedUseFactory.create(name="foo")
    data = {"pk": intended_use.pk, "name": "bar"}

    graphql.login_with_regular_user()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
