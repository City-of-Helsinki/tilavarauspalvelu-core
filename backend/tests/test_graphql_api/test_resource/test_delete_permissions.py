from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import ResourceFactory

from .helpers import DELETE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__delete__regular_user(graphql: GraphQLClient) -> None:
    resource = ResourceFactory.create()
    graphql.login_with_regular_user()

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.error_message() == "No permission to delete."
