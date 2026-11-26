from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import UnitFactory

from .helpers import UPDATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__update__regular_user(graphql: GraphQLClient) -> None:
    unit = UnitFactory.create()
    graphql.login_with_regular_user()

    data = {"pk": unit.pk, "descriptionFi": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
