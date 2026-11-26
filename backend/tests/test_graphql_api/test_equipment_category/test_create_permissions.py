from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__create__regular_user_cannot_create(graphql: GraphQLClient) -> None:
    data = {"name": "foo"}

    graphql.login_with_regular_user()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."
