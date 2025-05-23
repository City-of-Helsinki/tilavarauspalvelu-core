from __future__ import annotations

import pytest

from tests.factories import PurposeFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__update__regular_user(graphql):
    purpose = PurposeFactory.create(name="foo")
    data = {"pk": purpose.pk, "name": "bar"}

    graphql.login_with_regular_user()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
