from __future__ import annotations

import pytest

from tests.factories import ResourceFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__update__regular_user(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_regular_user()

    data = {
        "pk": resource.pk,
        "nameFi": "a",
    }
    response = graphql(UPDATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to update a resource"
