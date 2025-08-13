from __future__ import annotations

import pytest

from tests.factories import ResourceFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__delete__regular_user(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_regular_user()

    response = graphql(DELETE_MUTATION, variables={"input": {"pk": resource.pk}})

    assert response.error_message(0) == "No permission to delete a resource"
